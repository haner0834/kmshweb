import { useNavigate } from "react-router-dom";

const RedirectFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen join-vertical flex justify-center items-center">
      <div className="bg-base-300 min-w-80 rounded-xl p-4 m-10">
        <h1 className="font-black">Sorry</h1>
        <p className="mb-4 mt-2">Something's went wrong here...</p>

        <div className="space-x-4">
          {/* TODO: Link to report page */}
          <button className="btn btn-outline btn-primary">Report</button>
          <button onClick={() => navigate("/home")} className="btn btn-primary">
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedirectFailed;
