export function getRealIdVerificationStatus(status) {
    switch (status) {
        case 0:
            return "UNVERIFIED";
        case 1:
            return "PENDING_REVIEW";
        case 2:
            return "REVIEW_REJECTED";
        case 3:
            return "VERIFIED"
        default:
            return "UNVERIFIED"
    }
}
export  function getProfileColor(score) {
    if (score <= 2) {
        return "red";
    } else if (score <= 4) {
        return "orange";
    } else {
        return "#50B359";
    }
}