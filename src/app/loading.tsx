import React from "react";

export default function Loading() {
  return (
    <div className="p-4 md:p-6 bg-slate-100 dark:bg-slate-900 min-h-screen text-black dark:text-white transition-colors duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded shadow animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            <thead className="bg-slate-800 dark:bg-slate-950 text-white">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                  <th key={i} className="px-4 py-3 text-left">
                    <div className="h-4 w-16 bg-slate-600 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {[1, 2, 3, 4, 5].map(row => (
                <tr key={row}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => (
                    <td key={col} className="px-4 py-4">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
