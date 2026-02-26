# Kubernetes Concepts Used In This Repo

This project deploys a Next.js app and a Postgres database into Kubernetes using manifest files and `kustomize`.

The manifests in `k8s/` are focused on workload and networking resources. The database password secret is expected to exist in the cluster as `contacts-db-secret` (for example, provisioned by Terraform), and is consumed by the app/database Pods.

## 1) Kustomization (resource composition)

Files: `kustomization.yaml`, `overlays/dev/kustomization.yaml`, `overlays/prod/kustomization.yaml`

`Kustomization` is the entrypoint that bundles multiple manifests into one deployable set.

- Root `k8s/kustomization.yaml` points to `overlays/prod` (default production apply target).
- `overlays/dev` is a SQLite setup for local/dev clusters:
  - app `Deployment` with `APP_DB_ENGINE=sqlite`
  - `SQLITE_DATABASE_URL=file:../data/contacts.db`
  - `sqlite-pvc` mounted at `/app/prisma/data`
- `overlays/prod` contains the current Postgres-based setup (config map, services, stateful DB, app deployment, ingress, managed cert).
- Typical usage:

```bash
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/prod
```

## 2) Deployment (stateless app replicas)

Files: `overlays/dev/deployment.yaml`, `overlays/prod/deployment.yaml` (resource name: `contacts`)

`Deployment` manages stateless app Pods and keeps the desired replica count running.

- `overlays/prod` uses `replicas: 3`; `overlays/dev` uses `replicas: 1`.
- `selector.matchLabels` and Pod template `labels` (`app: contacts`) tie the Deployment to its Pods.
- In prod, the container reads DB config from `ConfigMap` + `Secret`.
- In dev, the container uses SQLite env vars directly (`APP_DB_ENGINE=sqlite`, `SQLITE_DATABASE_URL=file:../data/contacts.db`).
- The image is pulled from Artifact Registry:
  - `us-west1-docker.pkg.dev/juancavallotti/eetr-artifacts/contacts-db-sample:latest`
- This manifest does not currently set `nodeSelector` or `imagePullPolicy`, so normal cluster scheduling and default image pull behavior apply.

## 3) StatefulSet (stateful database workload)

File: `overlays/prod/statefulset.yaml` (resource name: `postgres`)

`StatefulSet` is used for stateful services like databases that need stable identity and persistent storage.

- `serviceName: postgres` connects the StatefulSet to the headless service.
- `replicas: 1` runs a single Postgres instance.
- The Pod gets `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from Kubernetes config resources.
- `volumeClaimTemplates` creates a per-Pod PersistentVolumeClaim named `data` and mounts it at `/var/lib/postgresql/data`.

## 4) Services (internal networking and discovery)

Files: `overlays/dev/contacts-service.yaml`, `overlays/prod/contacts-service.yaml`, `overlays/prod/service.yaml`, `overlays/prod/postgres-service.yaml`

This repo uses two service patterns:

- App service `contacts` (port `80` -> targetPort `3000`)
  - Exposes the Next.js Pods internally in the cluster.
  - Used as the backend service for Ingress.
- Headless service `postgres` (`clusterIP: None`)
  - Used with the StatefulSet for stable DNS identity of stateful Pods.
- Regular ClusterIP service `postgres-rw`
  - Provides a stable virtual IP/DNS endpoint for clients to connect to Postgres.
  - The app uses `DB_HOST=postgres-rw` from `ConfigMap`.

Both services route traffic using `selector: app: postgres`.

## 5) ConfigMap (non-secret configuration)

File: `overlays/prod/db-configmap.yaml` (resource name: `contacts-db-config`)

`ConfigMap` stores plain-text configuration data consumed by Pods.

Values defined here include:

- `APP_DB_ENGINE`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_SCHEMA`
- `POSTGRES_USER`

The app and database manifests consume these values with `configMapKeyRef`.

## 6) Secret (sensitive configuration)

Resource: `contacts-db-secret` (consumed in `overlays/prod/deployment.yaml` and `overlays/prod/statefulset.yaml`)

`Secret` stores sensitive values, in this case `POSTGRES_PASSWORD`.

- It is injected into containers with `secretKeyRef`.
- This keeps credentials out of plain-text config maps and app manifests.
- A secret manifest file is not currently included in `k8s/`; the secret is expected to be created before applying workloads (for example by Terraform in `infra/terraform`).

## 7) Environment variable wiring

Mainly in: `overlays/prod/deployment.yaml` and `overlays/dev/deployment.yaml`

In prod, the app container combines values from config and secret into runtime env vars:

- Individual fields (`DB_HOST`, `DB_PORT`, etc.) come from `ConfigMap`.
- Password comes from `Secret`.
- `POSTGRES_DATABASE_URL` is assembled from these variables:

```text
postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?schema=$(DB_SCHEMA)
```

This pattern decouples app image from environment-specific database endpoints. In dev, SQLite is configured directly in the deployment manifest.

## 8) Persistent storage patterns in this repo

Files: `overlays/prod/statefulset.yaml`, `overlays/dev/pvc.yaml`

- Prod DB persistence is implemented with `StatefulSet.volumeClaimTemplates`.
- Dev SQLite persistence is implemented with `sqlite-pvc` in `overlays/dev/pvc.yaml`, mounted by the dev app deployment.

## 9) Label selectors and workload-to-service routing

A consistent `app` label ties objects together:

- `Deployment` uses `app: contacts`
- `StatefulSet` and DB services use `app: postgres`
- Services select Pods by label, which is how Kubernetes routes traffic to the right workload.

## 10) Operational notes for this project

- Local default (`.env`) is SQLite (`APP_DB_ENGINE=sqlite`).
- Kubernetes now has two overlays:
  - `dev`: SQLite + PVC (no Postgres StatefulSet/Ingress resources).
  - `prod`: Postgres + StatefulSet + ingress/certificate resources.
- To run in Kubernetes, ensure the app image in the selected overlay deployment is available to cluster nodes.
- Ensure `contacts-db-secret` exists in the target namespace before deploying app/database workloads.
- The app-to-db dependency is represented through service DNS (`postgres-rw:5432`) rather than hardcoded Pod IPs.
- The app now redacts DB credentials server-side before display/logging:
  - UI prints a masked DB URL (password replaced with `***`).
  - Startup logs also use the redacted URL.
  - This avoids leaking raw credentials to browser responses and routine logs.

## 11) Ingress and managed TLS

Files: `overlays/prod/ingress.yaml`, `overlays/prod/managed-certificate.yaml`

- `Ingress` (`contacts-ingress`) routes `contacts.eetr.app` to service `contacts` on port `80`.
- GCE annotations configure:
  - ingress class (`kubernetes.io/ingress.class: gce`)
  - global static IP (`kubernetes.io/ingress.global-static-ip-name: contacts-static-ip`)
  - managed certificate binding (`networking.gke.io/managed-certificates: contacts-cert`)
- `ManagedCertificate` (`contacts-cert`) requests TLS cert provisioning for `contacts.eetr.app`.

## 12) Quick verification commands

Use these to inspect what was applied and validate concept understanding:

```bash
# Apply dev or prod overlays
kubectl apply -k k8s/overlays/dev
kubectl apply -k k8s/overlays/prod

# List main resources
kubectl get deploy,statefulset,svc,configmap,secret,ingress,managedcertificate,pvc

# Render overlays without applying
kubectl kustomize k8s/overlays/dev
kubectl kustomize k8s/overlays/prod

# Inspect app deployment config and env wiring
kubectl describe deployment contacts

# Inspect postgres stateful workload and volume claims
kubectl describe statefulset postgres
kubectl get pvc

# Check generated Pod names and labels
kubectl get pods --show-labels

# Confirm secret expected by workloads exists
kubectl get secret contacts-db-secret

# Verify ingress and certificate status
kubectl get ingress contacts-ingress
kubectl get managedcertificate contacts-cert
```
