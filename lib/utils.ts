// zach/zet-632-pr-preview-environments -> zet-632
const getIssueIdFromBranchName = (branchName) => {
  const branchNameParts = branchName.split("-");
  return branchNameParts.slice(0, 2).join("-");
};

export default {
  getIssueIdFromBranchName,
};
