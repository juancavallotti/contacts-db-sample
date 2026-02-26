# Kubernetes Concepts Used In This Repo

This project deploys a Next.js app and a Postgres database into Kubernetes using manifest files and `kustomize`.

## 1) Kustomization (resource composition)

File: `kustomization.yaml`

`Kustomization` is the entrypoint that bundles multiple manifests into one deployable set.

- It lists the resources to apply together: config, secret, services, stateful workload, and app workload.
- Typical usage:

```bash
kubectl apply -k .
```

## 2) Deployment (stateless app replicas)

File: `deployment.yaml` (resource name: `contacts`)

`Deployment` manages stateless app Pods and keeps the desired replica count running.

- `replicas: 3` means Kubernetes schedules three app Pods.
- `selector.matchLabels` and Pod template `labels` (`app: contacts`) tie the Deployment to its Pods.
- The container reads database configuration from `ConfigMap` + `Secret`.
- `imagePullPolicy: Never` is useful for local Minikube workflows where the image is built directly into the cluster node.
- `nodeSelector` pins Pods to `minikube-m02`, which demonstrates scheduling constraints by node label.

## 3) StatefulSet (stateful database workload)

File: `statefulset.yaml` (resource name: `postgres`)

`StatefulSet` is used for stateful services like databases that need stable identity and persistent storage.

- `serviceName: postgres` connects the StatefulSet to the headless service.
- `replicas: 1` runs a single Postgres instance.
- The Pod gets `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` from Kubernetes config resources.
- `volumeClaimTemplates` creates a per-Pod PersistentVolumeClaim named `data` and mounts it at `/var/lib/postgresql/data`.

## 4) Services (internal networking and discovery)

Files: `service.yaml`, `postgres-service.yaml`

This repo uses two service patterns:

- Headless service `postgres` (`clusterIP: None`)
  - Used with the StatefulSet for stable DNS identity of stateful Pods.
- Regular ClusterIP service `postgres-rw`
  - Provides a stable virtual IP/DNS endpoint for clients to connect to Postgres.
  - The app uses `DB_HOST=postgres-rw` from `ConfigMap`.

Both services route traffic using `selector: app: postgres`.

## 5) ConfigMap (non-secret configuration)

File: `db-configmap.yaml` (resource name: `contacts-db-config`)

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

File: `db-secret.yaml` (resource name: `contacts-db-secret`)

`Secret` stores sensitive values, in this case `POSTGRES_PASSWORD`.

- It is injected into containers with `secretKeyRef`.
- This keeps credentials out of plain-text config maps and app manifests.
- Current manifest uses `stringData`, which is convenient in development; production setups usually use external secret management and stricter handling.

## 7) Environment variable wiring

Mainly in: `deployment.yaml`

The app container combines values from config and secret into runtime env vars:

- Individual fields (`DB_HOST`, `DB_PORT`, etc.) come from `ConfigMap`.
- Password comes from `Secret`.
- `POSTGRES_DATABASE_URL` is assembled from these variables:

```text
postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?schema=$(DB_SCHEMA)
```

This pattern decouples app image from environment-specific database endpoints.

## 8) Persistent storage patterns in this repo

Files: `statefulset.yaml`, `pvc.yaml`

- Active DB persistence is implemented with `StatefulSet.volumeClaimTemplates`.
- There is also a standalone `PersistentVolumeClaim` in `pvc.yaml` (`sqlite-pvc`) that requests `64Mi`.
- Important: `pvc.yaml` exists but is not currently included in `kustomization.yaml`, so it is not applied by `kubectl apply -k .` unless applied separately.

## 9) Label selectors and workload-to-service routing

A consistent `app` label ties objects together:

- `Deployment` uses `app: contacts`
- `StatefulSet` and DB services use `app: postgres`
- Services select Pods by label, which is how Kubernetes routes traffic to the right workload.

## 10) Operational notes for this project

- Local default (`.env`) is SQLite (`APP_DB_ENGINE=sqlite`), while Kubernetes manifests are wired for Postgres (`APP_DB_ENGINE=postgres` in `ConfigMap`).
- To run in Kubernetes, ensure the app image `contacts-db-sample:latest` is available to cluster nodes (for Minikube this is often built in-cluster).
- The app-to-db dependency is represented through service DNS (`postgres-rw:5432`) rather than hardcoded Pod IPs.

## 11) Quick verification commands

Use these to inspect what was applied and validate concept understanding:

```bash
# Apply all resources in kustomization.yaml
kubectl apply -k .

# List main resources
kubectl get deploy,statefulset,svc,configmap,secret,pvc

# Inspect app deployment config and env wiring
kubectl describe deployment contacts

# Inspect postgres stateful workload and volume claims
kubectl describe statefulset postgres
kubectl get pvc

# Check generated Pod names and labels
kubectl get pods --show-labels
```
