import SkeletonWrapper from "../_components/SkeletonWrapper"
import DashboardContent from "../_components/DashboardContent";

export default function Loading() {
    return (
        <SkeletonWrapper isLoading={true} >
            <DashboardContent />
        </SkeletonWrapper>
    )
}