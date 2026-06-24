const SkeletonRow = ({ cols = 7 }) => {
    return (
        <tr className="animate-pulse border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-4">
                    <div className="h-4 rounded bg-gray-200" />
                </td>
            ))}
        </tr>
    );
};

const SkeletonTable = ({ rows = 6, cols = 7 }) => {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} cols={cols} />
            ))}
        </tbody>
    );
};

export default SkeletonTable;