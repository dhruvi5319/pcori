import * as Progress from '@radix-ui/react-progress'

interface UploadProgressBarProps { progress: number }

export function UploadProgressBar({ progress }: UploadProgressBarProps) {
  return (
    <Progress.Root
      value={progress}
      className="h-[6px] bg-[#E5E7EB] rounded-[3px] overflow-hidden"
      aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
    >
      <Progress.Indicator
        className="h-full rounded-[3px] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1D4ED8 0%, #7C3AED 100%)'
        }}
      />
    </Progress.Root>
  )
}
