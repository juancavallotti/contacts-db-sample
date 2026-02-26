# Deployment Architecture

This document describes how deployments work for `dev`, `prod`, and local minikube in this repository.

## Scope And Assumptions

- A single Cloud Build trigger is provisioned by Terraform per environment.
- Target environment is selected by Terraform variable `deploy_environment`.
- Cloud Build maps that value to `_K8S_OVERLAY_PATH = k8s/overlays/<env>`.
- Kubernetes manifests are available in two forms:
  - **Kustomize**: shared base and env-specific overlays (`k8s/base`, `k8s/overlays/{minikube,dev,prod}`).
  - **Helm**: single chart `helm/contacts` with environment-specific values files (see [Helm chart](#helm-chart)).
- Base app deployment defines HTTP health probes (`liveness`, `readiness`, `startup`) against `GET /api/healthcheck`.
- Runtime differences (SQLite vs Postgres, service type, ingress) are defined in overlays (Kustomize) or values (Helm).

## CI/CD Flow (Shared)

The default pipeline uses **Kustomize** to apply overlays. An optional **Helm** deploy path is documented in `cloudbuild.yaml` as a commented-out block.

### Kustomize path (default)

```mermaid
flowchart LR
  gitPush["GitHub branch/tag push"] --> cbTrigger["Cloud Build trigger (contacts-<env>-deploy)"]
  cbTrigger --> buildStep["Build image (Docker)"]
  buildStep --> pushStep["Push image to Artifact Registry"]
  pushStep --> getCreds["Get GKE credentials"]
  getCreds --> applyOverlay["kubectl apply -k k8s/overlays/<env>"]
  applyOverlay --> reapplyImage["kustomize + sed replace image + kubectl apply"]
  reapplyImage --> runMigration["Delete job, re-apply Job with built image, suspend=false"]
  runMigration --> waitMigration["kubectl wait job/contacts-migration complete"]
  waitMigration --> rollout["kubectl rollout status deployment/contacts"]
```

**Migration job and immutability:** A Kubernetes Job’s `spec.template` is immutable after creation. The pipeline therefore does not use `kubectl set image` for the migration job. It deletes the existing job (if any), then applies the overlay again with the built image substituted into the manifests (via `kubectl kustomize` + `sed`), so the job is created once with the correct image. Deployment image updates still work via the same re-apply.

### Helm path (optional, commented out)

When enabled, the pipeline would:

1. Install Helm 3 in a step, get GKE credentials, then run `helm upgrade --install contacts ./helm/contacts -f ./helm/contacts/values-<env>.yaml` with image overrides (`--set image.repository=... --set image.tag=${SHORT_SHA}`).
2. Patch the migration job to unsuspend and wait for completion.
3. Wait for deployment rollout.

The files `values-dev.yaml` and `values-prod.yaml` are **gitignored**; CI must provide them (e.g. from Secret Manager or a step that writes the file from substitutions) when using the Helm path.

## Kustomize Layering

```mermaid
flowchart TB
  base["k8s/base"] --> minikubeOverlay["k8s/overlays/minikube"]
  base --> devOverlay["k8s/overlays/dev"]
  base --> prodOverlay["k8s/overlays/prod"]
  minikubeOverlay --> minikubeRender["Minikube rendered manifests"]
  devOverlay --> devRender["Dev rendered manifests"]
  prodOverlay --> prodRender["Prod rendered manifests"]
```

## Helm chart

A Helm chart at `helm/contacts/` mirrors the same runtime behavior as the Kustomize overlays, with one chart and environment-specific values:

- **Committed**: `values.yaml` (defaults), `values-minikube.yaml` (local SQLite, NodePort), `values-dev.sample.yaml`, `values-prod.sample.yaml` (samples only).
- **Gitignored**: `values-dev.yaml`, `values-prod.yaml` (used at deploy time; CI or users create from samples).

Templates branch on `database.engine` (sqlite vs postgres) and `ingress.enabled`, so the same chart deploys minikube (SQLite + PVC + NodePort), dev (SQLite + LoadBalancer), or prod (Postgres + StatefulSet + Ingress + ManagedCertificate). The Postgres password is not templated; prod relies on the pre-created Secret `contacts-db-secret`.

```mermaid
flowchart LR
  subgraph chart [Helm chart]
    V["values-*.yaml"]
    T["templates/"]
    V --> T
  end
  T --> minikubeOut["Minikube: SQLite, NodePort"]
  T --> devOut["Dev: SQLite, LoadBalancer"]
  T --> prodOut["Prod: Postgres, Ingress"]
```

**Minikube with Helm:** Use `./scripts/minikube-helm-apply-and-migrate.sh` after `./scripts/minikube-build-and-load.sh`; the script runs `helm upgrade --install` with `values-minikube.yaml` and image overrides, then unsuspends the migration job and waits for completion.

## Minikube (local Kubernetes)

Minikube uses the same app image and SQLite + PVC pattern as dev, with a `NodePort` service for local access.

- **Kustomize**: overlay `k8s/overlays/minikube`; apply with `kubectl apply -k k8s/overlays/minikube`, then update image tags and run migration (see README).
- **Helm**: `helm/contacts` with `values-minikube.yaml`; use `./scripts/minikube-helm-apply-and-migrate.sh` after building and loading the image with `./scripts/minikube-build-and-load.sh`.

## Dev Runtime Architecture (`k8s/overlays/dev`)

```mermaid
flowchart TB
  devOverlay["Kustomize overlay: dev"] --> contactsSvcDev["Service: contacts (80 -> 3000)"]
  devOverlay --> contactsDeployDev["Deployment: contacts (replicas=1)"]
  devOverlay --> sqlitePvc["PVC: sqlite-pvc (64Mi)"]

  contactsSvcDev --> contactsDeployDev
  contactsDeployDev --> sqliteDb["SQLite file /app/prisma/data/contacts.db"]
  sqlitePvc --> sqliteDb
```

### Dev Notes

- App container uses:
  - `APP_DB_ENGINE=sqlite`
  - `SQLITE_DATABASE_URL=file:../data/contacts.db`
- Base `Deployment/contacts` health probes call `/api/healthcheck` on container port `3000`.
- Migration job uses the same env vars and mounts `sqlite-pvc` at `/app/prisma/data`.
- `Service/contacts` is patched to `type: LoadBalancer` for direct external access.
- No ingress, managed certificate, or Postgres resources in this overlay.

## Prod Runtime Architecture (`k8s/overlays/prod`)

```mermaid
flowchart TB
  internet["Client traffic"] --> dnsRecord["Cloud DNS A record contacts.eetr.app"]
  dnsRecord --> staticIp["Global static IP contacts-static-ip"]
  staticIp --> ingress["Ingress: contacts-ingress (GCE)"]
  managedCert["ManagedCertificate: contacts-cert"] --> ingress
  ingress --> contactsSvcProd["Service: contacts (80 -> 3000)"]
  contactsSvcProd --> contactsDeployProd["Deployment: contacts (replicas=3)"]

  contactsDeployProd --> dbConn["POSTGRES_DATABASE_URL via env vars"]
  dbConfig["ConfigMap: contacts-db-config"] --> contactsDeployProd
  dbSecret["Secret: contacts-db-secret"] --> contactsDeployProd

  dbConn --> postgresRw["Service: postgres-rw (ClusterIP 5432)"]
  postgresRw --> postgresSts["StatefulSet: postgres (replicas=1)"]
  postgresHeadless["Service: postgres (headless)"] --> postgresSts
  dbConfig --> postgresSts
  dbSecret --> postgresSts
  postgresSts --> pgData["PVC template: data (128Mi)"]
```

### Prod Notes

- App reads DB host, port, name, schema, and user from `contacts-db-config`.
- App and Postgres read `POSTGRES_PASSWORD` from `contacts-db-secret`.
- Base `Deployment/contacts` health probes call `/api/healthcheck` on container port `3000`.
- Migration job reuses the same ConfigMap/Secret env wiring as the app deployment.
- Ingress host is `contacts.eetr.app`, with GCE ingress annotations and managed TLS certificate.

## Resource Inventory

### Terraform (Infrastructure + CI/CD)

- GKE Autopilot cluster: `google_container_cluster.autopilot`
- Cloud Build trigger: `google_cloudbuild_trigger.main_push`
- Runner service account and IAM custom role for Cloud Build:
  - `google_service_account.cloudbuild_runner`
  - `google_project_iam_custom_role.cloudbuild_runner`
- Kubernetes secret created through Terraform Kubernetes provider:
  - `kubernetes_secret_v1.contacts_db_secret`
- Networking for production entrypoint:
  - `google_compute_global_address.contacts_ingress`
  - `google_dns_record_set.contacts_a_record`

### Kubernetes Dev

- `Deployment/contacts`
- `Service/contacts` (`type: LoadBalancer`)
- `Job/contacts-migration`
- `PersistentVolumeClaim/sqlite-pvc`

### Kubernetes Prod

- `Deployment/contacts`
- `Service/contacts`
- `Job/contacts-migration`
- `ConfigMap/contacts-db-config`
- `Secret/contacts-db-secret`
- `Service/postgres` (headless)
- `Service/postgres-rw`
- `StatefulSet/postgres` with `volumeClaimTemplates`
- `Ingress/contacts-ingress`
- `ManagedCertificate/contacts-cert`

### Minikube (either Kustomize or Helm)

- `Deployment/contacts`
- `Service/contacts` (`type: NodePort` with Kustomize or Helm)
- `Job/contacts-migration`
- `PersistentVolumeClaim/sqlite-pvc`

## How To Switch Environments

1. Set Terraform variable `deploy_environment` to `dev` or `prod`.
2. Apply Terraform in `infra/terraform`.
3. Cloud Build trigger substitutions set:
   - `_K8S_OVERLAY_PATH = k8s/overlays/${deploy_environment}`
4. On matching branch/tag push events, Cloud Build deploys that overlay.

## Source References

- `cloudbuild.yaml` (Kustomize steps + commented Helm block)
- `infra/terraform/trigger.tf`
- `infra/terraform/variables.tf`
- `infra/terraform/main.tf`
- `infra/terraform/networking.tf`
- `infra/terraform/kubernetes-secret.tf`
- `k8s/base/kustomization.yaml`
- `k8s/base/deployment.yaml`
- `k8s/base/contacts-service.yaml`
- `k8s/base/migration-job.yaml`
- `k8s/overlays/minikube/kustomization.yaml`
- `k8s/overlays/minikube/*.yaml`
- `k8s/overlays/dev/kustomization.yaml`
- `k8s/overlays/dev/service-patch.yaml`
- `k8s/overlays/dev/deployment-patch.yaml`
- `k8s/overlays/dev/migration-job-patch.yaml`
- `k8s/overlays/dev/pvc.yaml`
- `k8s/overlays/prod/kustomization.yaml`
- `k8s/overlays/prod/deployment-patch.yaml`
- `k8s/overlays/prod/migration-job-patch.yaml`
- `k8s/overlays/prod/db-configmap.yaml`
- `k8s/overlays/prod/service.yaml`
- `k8s/overlays/prod/postgres-service.yaml`
- `k8s/overlays/prod/statefulset.yaml`
- `k8s/overlays/prod/managed-certificate.yaml`
- `k8s/overlays/prod/ingress.yaml`
- `helm/contacts/Chart.yaml`
- `helm/contacts/values.yaml`
- `helm/contacts/values-minikube.yaml`
- `helm/contacts/values-dev.sample.yaml`
- `helm/contacts/values-prod.sample.yaml`
- `helm/contacts/templates/*.yaml`
- `scripts/minikube-build-and-load.sh`
- `scripts/minikube-apply-and-migrate.sh` (Kustomize)
- `scripts/minikube-helm-apply-and-migrate.sh` (Helm)
