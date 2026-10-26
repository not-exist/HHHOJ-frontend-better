/** 横幅底部的双层波浪（Twilight 元素）。path 画 3 个周期，动画横移恰好一个周期（1440 单位），始终覆盖视口且无缝循环 */
export default function Waves() {
  const waveA = 'M0,64 ' + 'C240,96 480,32 720,48 C960,64 1200,112 1440,64 '.repeat(3)
  const waveB = 'M0,88 ' + 'C240,56 480,104 720,88 C960,72 1200,40 1440,88 '.repeat(3)
  return (
    <div className="waves" aria-hidden="true">
      <svg viewBox="0 0 2880 120" preserveAspectRatio="none">
        <path className="wave-a" fill="var(--bg)" d={`${waveA} L4320,120 L0,120 Z`} />
        <path className="wave-b" fill="var(--bg)" opacity="0.85" d={`${waveB} L4320,120 L0,120 Z`} />
      </svg>
    </div>
  )
}
