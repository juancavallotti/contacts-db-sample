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

output "cloud_build_service_account" {
  description = "Legacy Cloud Build service account used by this setup."
  value       = local.cloud_build_sa
}
