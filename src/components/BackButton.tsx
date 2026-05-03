import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-20 left-4 z-40 flex items-center gap-2 px-3 py-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors duration-200 group"
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
};

export default BackButton;
