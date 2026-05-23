import * as Progress from '@radix-ui/react-progress'

interface UploadProgressBarProps {
  progress: number
}

export function UploadProgressBar({ progress }: UploadProgressBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <Progress.Root
        value={progress}
        className="h-[6px] bg-[#E5E7EB] dark:bg-[#2A2A2A] rounded-[3px] overflow-hidden"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${progress}%`}
      >
        <Progress.Indicator
          className="h-full rounded-[3px] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #1D4ED8 0%, #7C3AED 100%)',
          }}
        />
      </Progress.Root>
      <p className="text-[12px] text-gray-400 text-right">{progress}%</p>
    </div>
  )
}
