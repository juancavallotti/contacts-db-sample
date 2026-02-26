output "cluster_name" {
  description = "GKE cluster name."
  value       = google_container_cluster.autopilot.name
}

output "cluster_location" {
  description = "GKE cluster location/region."
  value       = google_container_cluster.autopilot.location
}

output "artifact_repo_path" {
  description = "Artifact Registry base repository path used by Cloud Build."
  value       = var.artifact_repo_path
}

output "cloud_build_runner_service_account" {
  description = "Dedicated service account used by the Cloud Build trigger."
  value       = google_service_account.cloudbuild_runner.email
}

output "cloud_build_runner_custom_role" {
  description = "Custom IAM role assigned to the Cloud Build runner service account."
  value       = google_project_iam_custom_role.cloudbuild_runner.name
}
