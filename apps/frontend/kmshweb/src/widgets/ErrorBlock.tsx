import { useNavigate } from "react-router-dom";

type ErrorBlockProps = {
  title: string;
  description: string;
};

const ErrorBlock = ({ title, description }: ErrorBlockProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-base-300 min-w-80 rounded-xl p-4 m-10">
      <h1 className="font-black">{title}</h1>
      <p className="mb-4 mt-2">{description}</p>

      <div className="space-x-4">
        {/* TODO: Link to report page */}
        <button className="btn btn-outline btn-primary">Report</button>

        <button onClick={() => navigate("/home")} className="btn btn-primary">
          Home
        </button>
      </div>
    </div>
  );
};

export default ErrorBlock;
