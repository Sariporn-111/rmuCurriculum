const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4
                    border-blue-100 border-t-blue-600" />
        <span className="ml-3 text-sm text-gray-400">กำลังโหลด...</span>
    </div>
);

export default LoadingSpinner;