import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, onPageChange }) => {
    const pages = [];

    const delta = 1;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    if (totalPages >= 1) pages.push(1);

    if (left > 2) pages.push("...");

    for (let i = left; i <= right; i++) {
        if (i !== 1 && i !== totalPages) {
            pages.push(i);
        }
    }

    if (right < totalPages - 1) pages.push("...");

    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-1">

            {/* LEFT TEXT */}
            <p className="text-sm text-gray-500">
                แสดงหน้า {page} จาก {totalPages} หน้า
            </p>

            {/* RIGHT PAGINATION */}
            <div className="flex items-center gap-2">

                {/* PREV */}
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition
                        ${page === 1
                            ? "cursor-not-allowed border-gray-100 text-gray-300"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                >
                    <ChevronLeft size={16} />
                </button>

                {/* PAGE */}
                {pages.map((p, i) =>
                    p === "..." ? (
                        <span
                            key={i}
                            className="px-1 text-sm text-gray-400"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition
                                ${p === page
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                {/* NEXT */}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition
                        ${page === totalPages
                            ? "cursor-not-allowed border-gray-100 text-gray-300"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                >
                    <ChevronRight size={16} />
                </button>

            </div>
        </div>
    );
};

export default Pagination;