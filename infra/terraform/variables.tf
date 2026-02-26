variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "region" {
  description = "GCP region for cluster and Cloud Build resources."
  type        = string
  default     = "us-west1"
}

variable "cluster_name" {
  description = "GKE Autopilot cluster name."
  type        = string
  default     = "contacts-autopilot"
}

variable "artifact_repo_path" {
  description = "Artifact Registry repository base path."
  type        = string
  default     = "us-west1-docker.pkg.dev/juancavallotti/eetr-artifacts"
}

variable "image_name" {
  description = "Container image name inside the Artifact Registry repository."
  type        = string
  default     = "contacts-db-sample"
}

variable "cloud_build_runner_account_id" {
  description = "Account id for the dedicated Cloud Build runner service account."
  type        = string
  default     = "contacts-cloudbuild-runner"
}

variable "github_owner" {
  description = "GitHub repository owner."
  type        = string
  default     = "juancavallotti"
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
  default     = "contacts-db-sample"
}

variable "trigger_branch_regex" {
  description = "Regex for push branch filter."
  type        = string
  default     = "^main$"
}

variable "db_password" {
  description = "Database password used for contacts-db-secret in Kubernetes."
  type        = string
  sensitive   = true
}
