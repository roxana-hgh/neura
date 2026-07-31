import AddNewList from "./addNewList";

function NoList() {
  return (
    <div className="py-5 w-full h-full">
      <div className="flex justify-center items-center flex-col gap-3 w-full h-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.75 8.623v7.379a4 4 0 0 0 4 4h10.5a4 4 0 0 0 4-4v-5.69a4 4 0 0 0-4-4H12M2.75 8.624V6.998a3 3 0 0 1 3-3h2.9a2.5 2.5 0 0 1 1.768.732L12 6.313m-9.25 2.31h5.904a2.5 2.5 0 0 0 1.768-.732L12 6.313"
          ></path>
        </svg>
        <span className="text-muted-foreground text-sm block">
          No projects available.
        </span>
        <AddNewList isSmall />
      </div>
    </div>
  );
}

export default NoList;
