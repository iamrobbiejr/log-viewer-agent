import MachineCard from "./MachineCard";

export default function CategoryGroup({ group, onSelectMachine }) {
  return (
    <section>
      {/* Group Header */}
      <div className="flex items-center gap-3 mb-4 w-full">
        <h2 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {group.category}
        </h2>
        
        {/* Divider line */}
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        
        {/* Stats */}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          ({group.online_count} / {group.total_count} online)
        </span>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.machines.map((machine) => (
          <MachineCard
            key={machine.id}
            machine={machine}
            onClick={() => onSelectMachine(machine)}
          />
        ))}
      </div>
    </section>
  );
}
