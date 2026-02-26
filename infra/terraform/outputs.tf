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

output "ingress_static_ip_name" {
  description = "Global static IP resource name used by GKE ingress."
  value       = google_compute_global_address.contacts_ingress.name
}

output "ingress_static_ip_address" {
  description = "Reserved global static IP address for contacts ingress."
  value       = google_compute_global_address.contacts_ingress.address
}

output "contacts_dns_fqdn" {
  description = "FQDN configured for contacts DNS A record."
  value       = google_dns_record_set.contacts_a_record.name
}
