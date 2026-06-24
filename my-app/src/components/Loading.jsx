export const Loading = () => (
  <div className="flex justify-center items-center h-screen bg-blue-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-700 mx-auto mb-3" />
      <p className="text-sm text-blue-700 font-medium">กำลังโหลด...</p>
    </div>
  </div>
);