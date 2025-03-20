import { FaMicrophone, FaCheckCircle } from "react-icons/fa";

interface MicrophoneButtonProps {
  isListening: boolean;
  isProcessing: boolean; // For the grey state
  isProcessComplete: boolean;
  onClick: () => void;
}

export const MicrophoneButton = ({
  isListening,
  isProcessing,
  isProcessComplete,
  onClick,
}: MicrophoneButtonProps) => {
  let buttonClass = "p-8 rounded-full transition-colors ";
  let icon = <FaMicrophone className="text-white text-6xl" />;
  let isDisabled = isListening || isProcessing || isProcessComplete;

  if (isListening) {
    // Red button while listening
    buttonClass += "bg-red-900 cursor-not-allowed";
  } else if (isProcessing) {
    // Grey button while processing
    buttonClass += "bg-gray-600 cursor-not-allowed";
  } else if (isProcessComplete) {
    // Green button when complete
    buttonClass += "bg-green-900 cursor-not-allowed";
    icon = <FaCheckCircle className="text-white text-6xl" />;
  } else {
    // Blue button in default state
    buttonClass += "bg-blue-900 hover:bg-blue-700";
  }

  return (
    <div className="flex flex-col items-center mt-8">
      <button onClick={onClick} disabled={isDisabled} className={buttonClass}>
        {icon}
      </button>
      {isListening ? (
        <p className="mt-4 text-white text-center">Listening...</p>
      ) : (
        <p className="mt-4 text-white text-center">
          Click to identify from microphone
        </p>
      )}
    </div>
  );
};
