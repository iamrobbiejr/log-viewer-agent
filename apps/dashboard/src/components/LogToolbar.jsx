export default function LogToolbar({ filename, lineCount }) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between sticky top-0 z-10">
      <div className="text-xs text-gray-400 font-mono truncate mr-4">
        {filename}
      </div>
      <div className="text-xs text-gray-600 flex-shrink-0">
        {lineCount} lines
      </div>
    </div>
  );
}
