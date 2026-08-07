export function getSubmissionDestination(flagKey, formPath, targetPath) {
  let submitted = false;

  try {
    submitted = localStorage.getItem(flagKey) === 'true';
  } catch (error) {
    submitted = false;
  }

  return submitted ? targetPath : formPath;
}