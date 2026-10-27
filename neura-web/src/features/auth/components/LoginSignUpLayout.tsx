function LoginSignUpLayout() {
  return (
    <div className=" h-full">
      <div className="neura h-full bg-neutral-900">
        <div className="md:w-2/3 m-auto lg:flex flex-col justify-center gap-3 h-full hidden">
          <span className="p-2 h-12 w-12 flex justify-center items-center font-bold text-lg bg-white text-neutral-900 rounded mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M184 0c30.9 0 56 25.1 56 56v400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1c3-28 26.8-49.9 55.7-49.9m144 0c28.9 0 52.6 21.9 55.7 49.9C411.5 56.9 432 82 432 112c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7c27.1 12.8 45.8 40.4 45.8 72.3c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56"
              />
            </svg>
          </span>
          <h1 className="text-4xl text-white font-bold">NEURA</h1>
          <span className="seprator w-12 pb-1 bg-white block my-3"></span>
          <h3 className="text-white font-medium text-3xl p-0">
            Think Less, Do More
          </h3>
          <p className="text-white text-lg">
            The AI-powered task assistant that helps you focus on what matters
            most.
          </p>
        </div>
        <div className="p-6 m-auto flex  flex-col justify-center items-center gap-2 h-full mt-10 mb-5 lg:hidden">
          <span className="p-2 h-10 w-10 flex justify-center items-center font-bold text-lg bg-white text-neutral-900 rounded mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M184 0c30.9 0 56 25.1 56 56v400c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1c3-28 26.8-49.9 55.7-49.9m144 0c28.9 0 52.6 21.9 55.7 49.9C411.5 56.9 432 82 432 112c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7c27.1 12.8 45.8 40.4 45.8 72.3c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56"
              />
            </svg>
          </span>
          <h1 className="text-2xl text-white font-bold">NEURA</h1>

          <h3 className="text-white font-medium text-lg p-0">
            Think Less, Do More
          </h3>
        </div>
      </div>
    </div>
  );
}

export default LoginSignUpLayout;
