import { Construction } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center -z-10">
      <div className="max-w-md text-center">
        <div className="flex justify-center">
          <div className="relative">
            <Construction className="h-24 w-24 text-orange-500 animate-pulse" />
          </div>
        </div>

        <div className="pt-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Under Maintenance
          </h1>
          <p className="pt-2 text-lg text-gray-600 dark:text-gray-400">
            We're currently performing scheduled maintenance to improve your
            experience.
          </p>
        </div>

        <div className="pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
            <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Service temporarily unavailable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
