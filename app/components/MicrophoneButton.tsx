import { FaMicrophone } from "react-icons/fa";
import { ClipLoader } from "react-spinners";

interface MicrophoneButtonProps {
  isListening: boolean;
  onClick: () => void;
}

export const MicrophoneButton = ({
  isListening,
  onClick,
}: MicrophoneButtonProps) => {
  return (
    <div className="flex flex-col items-center mt-8">
      {isListening ? (
        <div className="flex flex-col items-center">
          <ClipLoader color="#3b82f6" size={40} />
          <p className="mt-3 text-white">Listening...</p>
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={isListening}
          className={`p-8 rounded-full transition-colors ${
            isListening
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-900 hover:bg-red-900"
          }`}
        >
          <FaMicrophone className="text-white text-6xl" />
        </button>
      )}
      <p className="mt-4 text-white text-center">
        Click to identify from microphone
      </p>
    </div>
  );
};
