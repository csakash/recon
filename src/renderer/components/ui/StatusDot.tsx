export function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-[7px] h-[7px] rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
    />
  )
}
