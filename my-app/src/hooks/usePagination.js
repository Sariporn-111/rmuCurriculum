import { useState, useMemo } from "react";

const PAGE_SIZE = 10;

export const usePagination = (items = [], pageSize = PAGE_SIZE) => {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    // reset to page 1 when items change (e.g. after filter)
    useMemo(() => { setPage(1); }, [items.length]);

    const paginated = useMemo(
        () => items.slice((page - 1) * pageSize, page * pageSize),
        [items, page, pageSize]
    );

    return { page, setPage, totalPages, paginated };
};