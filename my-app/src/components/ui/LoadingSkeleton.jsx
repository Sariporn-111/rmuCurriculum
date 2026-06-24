const LoadingSkeleton = ({ rows = 5 }) => {
    return (
        <div className="animate-pulse">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-7 gap-4 border-b border-gray-100 px-4 py-4"
                >
                    {/* ชื่อ */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div className="h-4 w-32 rounded bg-gray-200" />
                    </div>

                    {/* column */}
                    <div className="h-4 w-20 rounded bg-gray-200" />
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-4 w-28 rounded bg-gray-200" />
                    <div className="h-4 w-20 rounded bg-gray-200" />

                    {/* status */}
                    <div className="flex justify-center">
                        <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </div>

                    {/* action */}
                    <div className="flex justify-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gray-200" />
                        <div className="h-7 w-7 rounded-lg bg-gray-200" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LoadingSkeleton;