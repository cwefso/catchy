import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface MessageProps {
  type: "success" | "error";
  message: string;
  songDetails?: { title: string; artist: string } | null;
}

export const Message = ({ type, message, songDetails }: MessageProps) => {
  const isSuccess = type === "success";
  const Icon = isSuccess ? FaCheckCircle : FaExclamationCircle;
  const bgColor = isSuccess ? "bg-blue-800/30" : "bg-red-800/30";
  const textColor = isSuccess ? "text-blue-300" : "text-red-300";

  return (
    <div
      className={`flex flex-col items-center mb-8 p-4 ${bgColor} rounded-lg`}
    >
      <Icon className={`${textColor} text-4xl mb-2`} />
      <p className={`text-lg ${textColor}`}>{message}</p>
      {songDetails && (
        <p className="mt-1 text-white text-center">
          {songDetails.title} by {songDetails.artist}
        </p>
      )}
    </div>
  );
};
