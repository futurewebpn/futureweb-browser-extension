export function getProjectId(responses) {
  const projectIds = responses[1]?.data?.projects?.map(project => project.id) || [];
  const lastProjectId = responses[0]?.data?.last_project_id;
  const userLastProjectId = responses[0]?.data?.user_last_project_id;

  if (projectIds.includes(lastProjectId)) {
    return lastProjectId;
  } else if (projectIds.includes(userLastProjectId)) {
    return userLastProjectId;
  } else if (projectIds.length > 0) {
    return projectIds[0];
  } else {
    throw new Error("No project IDs found in the response.");
  }
}