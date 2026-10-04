'use strict';
// ============================================================================
// ESP-WebSDR 中文增强版 · 界面文案翻译层
//
// 设计原则：
//   1. 默认中文，标题栏可一键切换英文，选择记录在 localStorage。
//   2. 英文缺失时回退到调用处传入的英文原文，因此 app.js / radio.js 里的
//      业务逻辑和错误信息与上游完全一致（官方测试也依赖这些英文原文）。
//   3. 静态节点用 data-i18n / data-i18n-title / data-i18n-aria / data-i18n-tip
//      标记；动态文案用 T(key, fallback, params) 取值。
// ============================================================================

const I18N = {
  /* ---------------------------------------------------------------- 页头 */
  'app.title': {zh: 'ESP-WebSDR · ESP32 频谱查看器', en: 'ESP-WebSDR · WebSerial receiver'},
  'brand.subtitle': {zh: '用 Espressif ESP32 芯片抓取原始 I/Q 信号', en: "Raw IQ Capture with Espressif's ESP32 Chips"},
  'brand.home': {zh: 'ESPARGOS 官网', en: 'ESPARGOS website'},
  'header.lang': {zh: 'EN', en: '中文'},
  'header.langTitle': {zh: '切换为英文界面', en: 'Switch to Chinese interface'},
  'header.guide': {zh: '使用说明', en: 'Guide'},
  'header.guideTitle': {zh: '显示 / 隐藏使用说明', en: 'Show / hide the guide'},

  /* ------------------------------------------------------------ 连接区域 */
  'conn.menuAria': {zh: '连接选项', en: 'Connection options'},
  'conn.last': {zh: '连接上次使用的设备', en: 'Connect to Last Device'},
  'conn.choose': {zh: '选择串口…', en: 'Choose Port…'},
  'conn.flash': {zh: '刷写固件…', en: 'Flash Firmware…'},

  /* -------------------------------------------------------------- 接收机 */
  'aside.receiver': {zh: '接收机', en: 'Receiver'},
  'freq.label': {zh: '中心频率', en: 'Center frequency'},
  'freq.unit': {zh: 'MHz', en: 'MHz'},
  'freq.preset24': {zh: '2.4 GHz', en: '2.4 GHz'},
  'freq.snapped': {zh: '{raw} MHz 超出这块芯片与固件的可用范围，已自动吸附到最近的可用频点 {value} MHz。', en: '{raw} MHz is outside the range this chip and firmware support; snapped to the nearest usable frequency, {value} MHz.'},
  'freq.preset55': {zh: '5.5 GHz', en: '5.5 GHz'},
  'dc.label': {zh: '零中频处理', en: '0 Hz (zero-IF)'},
  'dc.raw': {zh: '原样显示', en: 'show as is'},
  'dc.fill': {zh: '填充 DC 频点', en: 'fill DC bins'},
  'dc.offset': {zh: '偏移本振（信号离开 0 Hz）', en: 'offset LO (signal off 0 Hz)'},
  'dc.hint': {zh: 'ESP32 采用零中频结构，本振就在 0 Hz，频谱中心因此会有一条直流 / 本振泄漏尖峰。', en: 'The receiver is zero-IF: the LO sits at 0 Hz with a DC/LO-leakage spike. Offset LO keeps the tuned frequency away from it.'},
  'gain.mode': {zh: '接收增益模式', en: 'RX gain mode'},
  'gain.agc': {zh: '硬件 AGC（自动）', en: 'Hardware AGC'},
  'gain.manual': {zh: '手动', en: 'Manual'},
  'gain.index': {zh: '手动增益档位', en: 'Manual gain index'},
  'bw.label': {zh: '模拟带宽', en: 'Analog bandwidth'},
  'bw.unit': {zh: 'MHz', en: 'MHz'},
  'bw.open': {zh: '全开', en: 'Wide open'},
  'rate.label': {zh: '采样率 / 名义跨度', en: 'Sample rate / nominal span'},

  /* ------------------------------------------------------------ 捕获模式 */
  'capture.mode': {zh: '捕获模式', en: 'Capture mode'},
  'capture.iq': {zh: 'I/Q 流（电脑端 FFT）', en: 'I/Q Streaming'},
  'capture.spec': {zh: '片上频谱（ESP32 端 FFT）', en: 'On-Chip Spectrum'},
  'spec.row': {zh: '瀑布行时间', en: 'Waterfall row'},
  'spec.rowEvery': {zh: '每帧频谱', en: 'every spectrum'},
  'spec.row10': {zh: '10 ms · 取最大', en: '10 ms · max'},
  'spec.row50': {zh: '50 ms · 取最大', en: '50 ms · max'},
  'spec.detector': {zh: '检波方式', en: 'Detector'},
  'spec.detMean': {zh: '平均（同突发模式）', en: 'average (like burst mode)'},
  'spec.detMax': {zh: '最大保持（突发、跳变）', en: 'max-hold (bursts, edges)'},
  'spec.credit': {zh: '片上频谱由', en: 'Contributed by'},
  'fft.bins': {zh: 'FFT 频点数', en: 'FFT bins'},
  'iq.bits': {zh: 'WebSerial I/Q 位深', en: 'WebSerial I/Q'},
  'bits.8': {zh: '8 + 8 位（更快）', en: '8 + 8 bits'},
  'bits.10': {zh: '10 + 10 位（动态更大）', en: '10 + 10 bits'},

  /* ---------------------------------------------------------------- 显示 */
  'display.title': {zh: '显示', en: 'Display'},
  'display.floor': {zh: '底噪（Floor）', en: 'Floor'},
  'display.range': {zh: '动态范围（Range）', en: 'Range'},
  'display.average': {zh: '迹线平均', en: 'Trace averaging'},
  'avg.off': {zh: '关闭', en: 'Off'},
  'avg.short': {zh: '短', en: 'Short'},
  'avg.medium': {zh: '中', en: 'Medium'},
  'avg.high': {zh: '强', en: 'High'},
  'display.hold': {zh: '最大保持', en: 'Max hold'},
  'display.autoscale': {zh: '自动缩放纵轴', en: 'Auto scale'},
  'display.wifi': {zh: '显示 2.4G WiFi 信道', en: 'Show 2.4 GHz WiFi channels'},
  'desc.wifi': {zh: '在频谱上标出 2.4 GHz WiFi 的 1–14 信道（每个约 20 MHz 宽）。1、6、11 三个互不重叠，图中高亮，最值得关注；信号落在哪条色带里，就说明它占着哪个信道。鼠标停在频谱上还会直接报出信道号。', en: 'Marks 2.4 GHz WiFi channels 1–14 (about 20 MHz each) on the spectrum. Channels 1, 6 and 11 do not overlap and are highlighted; the band a signal sits in is the channel it occupies. Hovering the spectrum also reports the channel number.'},
  'display.dji': {zh: '显示 DJI 2.4G 频段', en: 'Show DJI 2.4 GHz band'},
  'desc.dji': {zh: '在频谱上标出 2402.5–2472.5 MHz 这一段——DJI 无人机图传与遥控常用的 2.4 GHz 频段范围。该区间被淡紫色覆盖、两侧画实线边界，区间名标在频谱上方。用来快速判断图传信号有没有落进这个范围；纯显示层，不影响采样与 FFT。', en: 'Marks the 2402.5–2472.5 MHz span — the 2.4 GHz range DJI drones commonly use for video and control links. The interval is tinted with solid boundary lines and named above the spectrum. Purely a display layer; it does not affect sampling or the FFT.'},
  'action.pause': {zh: '暂停', en: 'Pause'},
  'action.clear': {zh: '清除', en: 'Clear'},

  /* ------------------------------------------------------------ 显示区域 */
  'chart.power': {zh: '功率谱', en: 'Power spectrum'},
  'chart.waterfall': {zh: '瀑布图', en: 'Waterfall'},
  'empty.title': {zh: '连接 ESP-SDR 设备即可开始', en: 'Connect ESP-SDR to start'},
  'empty.lead': {zh: '三步上手：', en: 'Three steps:'},
  'empty.step1': {zh: '给 ESP32 板刷入 ESP-SDR 固件', en: 'Flash ESP-SDR firmware to your board'},
  'empty.step2': {zh: '用 USB 连接开发板，点右上角「连接」', en: 'Connect the board over USB, then select Connect'},
  'empty.step3': {zh: '设置中心频率，观察频谱与瀑布图', en: 'Set a center frequency and watch the spectrum'},

  /* ---------------------------------------------------------------- 页脚 */
  'footer.source': {zh: '源码', en: 'Source on GitHub'},
  'footer.espSdr': {zh: 'esp-sdr 固件 ↗', en: 'esp-sdr ↗'},
  'footer.espWebSdr': {zh: 'esp-web-sdr 网页端 ↗', en: 'esp-web-sdr ↗'},

  /* ================= 以下为 app.js 动态文案（英文回退即上游原文） ======= */
  'err.unknown': {zh: '未知操作'},
  'err.resume': {zh: '请修改设置后点击「继续」。'},
  'err.webserial': {zh: '此浏览器不支持 Web Serial（网页串口）。桌面请用 Chrome / Edge 89+，或 Firefox 151+；安卓请用 Chrome 154+ 并配 USB OTG 转接线；iPhone / iPad 上任何浏览器都不支持。', en: 'WebSerial support is required in this browser.'},
  'link.install': {zh: '安装 / 更新 ESP-SDR 固件'},
  'det.max': {zh: '最大保持'},
  'det.avg': {zh: '平均'},
  'acq.continuous': {zh: '连续采集'},
  'acq.snapshot': {zh: '快照'},
  'meas.start': {zh: '起始'},
  'meas.center': {zh: '中心'},
  'meas.span': {zh: '跨度'},
  'meas.stop': {zh: '终止'},
  'meas.rbw': {zh: '分辨率'},
  'meas.bins': {zh: '频点'},
  'meas.ref': {zh: '参考'},
  'meas.div': {zh: '每格'},
  'meas.det': {zh: '检波'},
  'meas.acq': {zh: '采集'},
  'meas.mode': {zh: '模式'},
  'mode.spec': {zh: '片上 FFT'},
  'mode.iq': {zh: '突发 I/Q'},
  'gain.statusAgc': {zh: '硬件 AGC'},
  'gain.statusManual': {zh: '手动 · 增益档 {index}'},
  'gain.needUpdate': {zh: '请更新 SDR 固件以启用增益控制。'},
  'footer.frames': {zh: '帧/秒', en: 'frames/s'},
  'footer.spectra': {zh: '频谱/秒'},
  'footer.ksps': {zh: '有效吞吐 kS/s', en: 'kS/s delivered'},
  'footer.latencyIq': {zh: 'ms / 单次采集+传输', en: 'ms / capture + transfer'},
  'footer.peak': {zh: '峰值 MHz', en: 'peak MHz'},
  'footer.latencySpec': {zh: 'ms / 单帧频谱'},
  'footer.latencySpecDetail': {zh: '{mode} {ffts} 次 FFT 结果'},
  'footer.modeMax': {zh: '取最大'},
  'footer.modeMean': {zh: '取平均'},
  'footer.throughput': {zh: 'kB/s（{transport} 传输）'},
  'footer.onChip': {zh: '片上 {rate} MS/s'},
  'footer.fftCoverage': {zh: 'FFT 覆盖 {pct}% 采样'},
  'crc.ok': {zh: 'CRC 校验通过 · 第 #{seq} 帧'},
  'crc.dropped': {zh: ' · 丢弃 {n} 次 · {samples} 采样'},
  'crc.spec': {zh: '片上频谱 · '},
  'crc.specContinuous': {zh: '连续采集'},
  'crc.specSnapshot': {zh: '快照，帧间有间隙'},
  'crc.specFrame': {zh: ' · 第 #{frame} 帧'},
  'crc.specDrops': {zh: ' · 丢弃 {n} 帧'},
  'crc.specErrors': {zh: ' · {n} 次 CRC 错误'},
  'crc.specHost': {zh: ' · 页面繁忙跳过 {kb} kB'},
  'state.disconnected': {zh: '未连接'},
  'state.receiving': {zh: '接收中'},
  'state.paused': {zh: '已暂停'},
  'btn.connect': {zh: '连接 ESP-SDR'},
  'btn.disconnect': {zh: '断开连接'},
  'btn.pause': {zh: '暂停'},
  'btn.resume': {zh: '继续'},
  'btn.switchBaud': {zh: '切换到 1 MBaud'},
  'btn.switching': {zh: '切换中…'},
  'canvas.title': {zh: '滚轮：缩放 · 拖动：平移（拖出边界会边拖边实时调谐）· 双击：全跨度 · 单击：调谐到该处'},
  'connect.title': {zh: '连接到上次使用的串口'},
  'warn.crcSlower': {zh: '反复出现采集 / CRC 错误。改用更慢的串口速率可能有帮助；射频采样率不受影响。'},
  'warn.crc1M': {zh: '1 MBaud 下仍出现采集 / CRC 错误。请检查 USB 连接，或改用更小的 FFT 频点数。'},
  'warn.crcUsb': {zh: '反复出现采集 / CRC 错误。请检查 USB 连接，或改用更小的 FFT 频点数。'},
  'warn.crcGeneric': {zh: '反复出现采集 / CRC 错误。请检查 USB 连接；更新固件后可启用更慢的串口速率。'},
  'spec.note.continuous': {zh: '射频在持续采集，但只分析其中部分 FFT 窗口；跳过的工作量和丢帧会显示在状态栏。'},
  'spec.note.snapshot': {zh: '对多次快照做片上 FFT；两次快照之间有接收间隙。'},

  /* ================= 以下为 radio.js 错误与警告（英文回退即上游原文） == */
  'radio.timeout': {zh: 'WebSerial 响应超时'},
  'radio.queueOverflow': {zh: 'WebSerial 接收队列溢出'},
  'radio.badHeader': {zh: 'WebSerial 响应头部无效'},
  'radio.emptyResponse': {zh: 'WebSerial 返回了空响应'},
  'radio.syncFailed': {zh: 'SDR 同步失败。请拔下 ESP32 设备再重新插入后重试；同时确认串口波特率设置、已刷入 ESP-SDR 固件，并关闭其他占用串口的 SDR 客户端。'},
  'radio.needsWebSerial': {zh: '此浏览器不支持 Web Serial（网页串口）。桌面请用 Chrome / Edge 89+，或 Firefox 151+；安卓请用 Chrome 154+ 并配 USB OTG 转接线；iPhone / iPad 上任何浏览器都不支持。', en: 'WebSerial support is required in this browser.'},
  'radio.needsSecure': {zh: '请通过 HTTPS 或 localhost 打开本页面。', en: 'Serve this page over HTTPS or localhost.'},
  /* 进入页面时的能力检测提示（本副本新增）：直接说清这台设备为什么不行、该怎么换 */
  'cap.ios': {zh: 'iPhone / iPad 上的所有浏览器（Safari、Chrome、Edge…）都不支持 Web Serial，无法连接 USB 串口设备。请改用电脑打开本页——Chrome、Edge、Firefox 151+ 都可以。', en: 'No browser on iPhone or iPad (Safari, Chrome, Edge…) supports Web Serial, so USB serial devices cannot be used here. Open this page on a computer instead — Chrome, Edge and Firefox 151+ all work.'},
  'cap.android': {zh: '这个浏览器不支持 Web Serial，接不了 USB 串口设备。安卓上目前只有 Chrome 154 及以上支持（2026 年 4 月才加入），其它安卓浏览器大多还没跟上；请换用新版 Chrome，并用 USB OTG 转接线（或转接头）连接 ESP32，系统弹窗询问「允许访问 USB 设备」时选允许。', en: 'This browser does not support Web Serial, so USB serial devices cannot be used. On Android only Chrome 154+ supports it (added April 2026) and most other Android browsers have not caught up; switch to a current Chrome, connect the ESP32 through a USB OTG adapter, and allow USB access when the system asks.'},
  'cap.desktop': {zh: '这个浏览器不支持 Web Serial，接不了 USB 串口设备。桌面端请用 Chrome / Edge 89 及以上、Opera 76 及以上，或 Firefox 151 及以上；Safari 至今没有支持。', en: 'This browser does not support Web Serial, so USB serial devices cannot be used. On desktop use Chrome / Edge 89+, Opera 76+, or Firefox 151+; Safari does not support it at all.'},
  'cap.insecure': {zh: '当前页面不在安全上下文里，浏览器不会把串口开放给网页。请用 https:// 或 http://127.0.0.1 打开本页（直接双击本地 index.html 是不行的）。', en: 'This page is not in a secure context, so the browser will not expose serial ports to it. Open the page over https:// or http://127.0.0.1 (opening the local index.html file directly does not work).'},
  'radio.badSpecCaps': {zh: '片上频谱能力声明无效'},
  'radio.badLimits': {zh: '接收机参数范围无效'},
  'radio.unsupportedFirmware': {zh: '不支持的 SDR 固件：'},
  'radio.badTransport': {zh: '串口传输类型响应无效'},
  'radio.badTuneRange': {zh: '调谐范围响应无效'},
  'radio.noBaudChange': {zh: '请更新 ESP-SDR 固件以启用串口波特率切换。'},
  'radio.chooseBaud': {zh: '请选择 1 或 2 MBaud。'},
  'radio.baudLost': {zh: '设备没有保持请求的波特率，重新打开串口时可能已复位；已恢复到默认连接。'},
  'radio.tuneRange': {zh: '请输入 {lo}–{hi} MHz 范围内的整数 MHz 中心频率。'},
  'radio.tuneChannel': {zh: '请输入 2412–2472 MHz 之间的 Wi-Fi 信道中心频率，步进 5 MHz。'},
  'radio.tuneUnsupported': {zh: '当前固件无法尝试该中心频率，请刷入支持扩展调谐的新固件。'},
  'radio.notConnected': {zh: '请先连接 SDR 设备。'},
  'radio.bandwidthRange': {zh: '请选择 {lo}–{hi} MHz 之间的模拟带宽。'},
  'radio.bandwidthUncharacterized': {zh: '该固件尚未标定手动模拟带宽。'},
  'radio.gainRange': {zh: '请选择 {min}–{max} 之间的增益档位。'},
  'radio.gainNeedUpdate': {zh: '请更新 SDR 固件以启用增益控制。'},
  'radio.agcNeedUpdate': {zh: '请更新 SDR 固件以启用硬件 AGC。'},
  'radio.badGainReply': {zh: '增益响应无效'},
  'radio.badCaptureLen': {zh: '采集长度或数据头无效'},
  'radio.badCrc': {zh: '采集数据 CRC 校验失败'},
  'radio.captureFailed': {zh: '连续 6 次采集失败：{msg}。请检查串口连接。'},
  'radio.badCaptureSettings': {zh: '采集参数无效'},
  'radio.specUnavailable': {zh: '当前连接不支持片上频谱流。'},
  'radio.badSpecSettings': {zh: '片上频谱参数不受支持'},
  'radio.badSpecHeader': {zh: '片上频谱数据头异常'},
  'radio.specStopped': {zh: '片上频谱采集已停止：{report}'},
  'radio.warnOutside': {zh: '超出 2.4 GHz ISM 频段。PLL 可能无法锁定，频谱也可能与设定的中心频率不符。'},
  'radio.warnOutsideC5': {zh: '超出 2.4 GHz ISM 频段和所支持的 5 GHz Wi-Fi 频段。PLL 可能无法锁定，频谱也可能与设定的中心频率不符。'},

  /* ==================================================== 帮助面板 · 说明 */
  'desc.receiver': {zh: '频率、增益与带宽决定「怎么收」。先设中心频率，其余保持默认即可。', en: 'Frequency, gain and bandwidth decide how the radio listens. Set a center frequency first; defaults are fine for the rest.'},
  'desc.freq': {zh: '本振频率。ESP32-S3 可尝试 2.2–2.7 GHz，但可靠工作的范围是 2.4 GHz ISM 频段。也可以直接单击频谱或瀑布图调谐。超出可用范围的部分会在频谱上画成红色边界区，输入也会被吸附回范围内。', en: 'Local-oscillator frequency. An ESP32-S3 can attempt 2.2–2.7 GHz, but the reliable range is the 2.4 GHz ISM band. You can also click the spectrum or waterfall to tune. Frequencies outside the usable range are shaded red on the spectrum, and typed values are snapped back inside it.'},
  'desc.dc': {zh: '零中频接收机在 0 Hz 处有一条直流 / 本振泄漏尖峰。「填充 DC 频点」把它抹平，「偏移本振」把关注频率挪开 0 Hz。', en: 'A zero-IF receiver shows a DC/LO-leakage spike at 0 Hz. Fill DC bins flattens it; Offset LO moves the tuned frequency away from 0 Hz.'},
  'desc.gain': {zh: '硬件 AGC 由芯片自动调节；需要固定条件对比时用手动档。增益档是芯片增益表索引，不是 dB。', en: 'Hardware AGC adjusts automatically; manual gain is steadier for comparisons. The index is a gain-table entry, not dB.'},
  'desc.bandwidth': {zh: '接收通道的模拟滤波器带宽。越窄底噪越低，但会削掉信号边缘。它比「采样率 / 名义跨度」窄的时候，频谱两侧是被接收机自己削掉的，中间那块平坦台地只是滤波器通带、不是信号。', en: 'Analog channel filter width. Narrower lowers the noise floor but trims the edges of a signal. When it is narrower than the sample span, the receiver itself cuts off both sides and the plateau in the middle is the filter passband, not a signal.'},
  'bw.note': {zh: '跨度 {span} MHz 比模拟带宽 {bw} MHz 宽：中心 ±{half} MHz 以外是被接收机自己削掉的，中间那块平坦台地就是滤波器通带、不是信号。要看整个跨度请勾选「全开」。', en: 'Span {span} MHz is wider than the {bw} MHz analog filter: beyond ±{half} MHz the receiver cuts the spectrum off by itself, so the plateau in the middle is the filter passband, not a signal. Tick "Wide open" to see the whole span.'},
  'desc.rate': {zh: '一屏能看到的频谱宽度。采样率越高，覆盖越宽、单次采集越短，串口压力也越大。80 MS/s 可覆盖整个 2.4 GHz ISM 频段。', en: 'How much spectrum fits on screen. Higher rates cover more bandwidth with shorter bursts and more serial pressure. 80 MS/s covers the whole 2.4 GHz ISM band.'},
  'desc.iq': {zh: '把原始 I/Q 采样传到电脑做 FFT：频点数可调、实现透明，但受串口带宽限制，采样是间断的。', en: 'Raw I/Q samples are FFT-ed on the PC: flexible bin counts, but bursts are interrupted by the serial link.'},
  'desc.spec': {zh: '由 ESP32 自己算好 FFT 再回传：数据量小、刷新快；部分芯片还能连续采集射频。', en: 'The ESP32 computes the FFT on-chip: less data, faster refresh, and continuous RF capture on some chips.'},
  'desc.fft': {zh: '频点数越大，频率分辨率越高（RBW 越细），但每帧需要更多采样，刷新率下降。2048 是通用折中。', en: 'More bins means finer resolution (smaller RBW) but more samples per frame and a slower refresh. 2048 is a good compromise.'},
  'desc.bits': {zh: '8+8 位传输更快，适合高采样率；10+10 位量化噪声更低，弱信号更清楚。', en: '8+8 bits transfers faster; 10+10 bits has lower quantisation noise for weak signals.'},
  'desc.floorRange': {zh: '底噪决定瀑布图颜色从哪里开始，动态范围决定颜色覆盖多少 dB。开启「自动缩放」会按当前噪声自动调整。', en: 'Floor sets where waterfall colours start; range sets how many dB they span. Auto scale adjusts both to the current noise.'},
  'desc.average': {zh: '对相邻帧做指数平均，噪声更稳、弱信号更明显，但会掩盖快速变化。', en: 'Exponential averaging over frames: steadier noise, clearer weak signals, slower to react.'},
  'desc.hold': {zh: '逐频点保留历史最大值，用来发现间歇性突发（如蓝牙广播）。', en: 'Keeps the historical maximum per bin, useful for intermittent bursts such as Bluetooth advertisements.'},
  'desc.footer': {zh: '状态栏：帧率、有效吞吐、单次采集耗时、峰值频点与 CRC 校验结果。把鼠标停在图上可读出任意频点的 dBFS。频率轴分两排：上排是绝对频率，下排是相对中心频率的偏移（中心为 0 MHz，右边为 +，左边为 −），中间那个 0 对准的就是正中央的本振。', en: 'Status bar: frame rate, delivered throughput, per-capture time, peak frequency and CRC result. Hover the chart for a per-bin dBFS readout. The axis has two rows: absolute frequency on top, offset from the center frequency below (0 MHz at the center, + to the right, − to the left); the 0 lines up with the LO at the middle of the display.'},

  /* ==================================================== 帮助面板 · 正文 */
  'help.title': {zh: '使用说明', en: 'Guide'},
  'help.what.h': {zh: '这是什么', en: 'What this is'},
  'help.what.p': {zh: 'ESP-WebSDR 是一个纯浏览器端的频谱查看器。它通过 WebSerial 直接读串口，把 ESP32 芯片内部那条未公开的原始 I/Q 采样通道变成一台低成本的 2.4 GHz 软件无线电接收机；不经过任何服务器，数据不离开本机。', en: 'ESP-WebSDR is a browser-only spectrum viewer. It talks to the board over WebSerial and turns the ESP32 internal raw I/Q path into a low-cost 2.4 GHz SDR receiver. No server is involved.'},
  'help.steps.h': {zh: '三步上手', en: 'Three steps'},
  'help.step1': {zh: '把开发板用 USB 接到电脑（优先使用板上的原生 USB 口，而不是 CH340/CP2102 那种串口桥）。', en: 'Connect the board over USB (prefer its native USB port over a CH340/CP2102 bridge).'},
  'help.step2': {zh: '打开「刷写固件…」，选择与芯片匹配的固件并写入。刷好后拔下设备等 5 秒再插回。', en: 'Open Flash Firmware…, pick the matching profile and install. Unplug for 5 seconds afterwards.'},
  'help.step3': {zh: '回到本页点右上角「连接 ESP-SDR」，然后设置中心频率，频谱与瀑布图就会开始刷新。', en: 'Return here, select Connect ESP-SDR, then set a center frequency.'},
  'help.params.h': {zh: '参数怎么选', en: 'Choosing settings'},
  'help.params.p1': {zh: '只看 2.4 GHz 有没有信号、想快速摸清环境：用「片上频谱」，80 MS/s 覆盖整段 ISM，配合 1024 或 2048 频点。', en: 'For a quick survey of 2.4 GHz, use On-Chip Spectrum at 80 MS/s with 1024–2048 bins.'},
  'help.params.p2': {zh: '想看清某个窄带信号、或需要原始 I/Q 自己做处理：用「I/Q 流」，降低采样率（例如 20 MS/s）能让每帧更长、更连续。', en: 'To inspect a narrowband signal or process raw I/Q yourself, use I/Q Streaming; a lower rate such as 20 MS/s gives longer, more continuous bursts.'},
  'help.params.p3': {zh: '信号弱：先确认增益（硬件 AGC 或手动调高），再考虑缩小模拟带宽压低底噪，最后才用迹线平均。', en: 'For weak signals: check gain first, then narrow the analog bandwidth, then average traces.'},
  'help.limits.h': {zh: '重要限制', en: 'Important limits'},
  'help.limits.1': {zh: '数据是间断的：串口带宽远小于射频采样率，除个别芯片的连续模式外，两次采集之间会丢信号，因此不适合解调连续数据。', en: 'Captures have gaps: serial throughput is far below the RF sample rate, so continuous demodulation is not possible except on chips with a continuous mode.'},
  'help.limits.2': {zh: '频段有限：只有 2.4 GHz 附近（ESP32-C5 额外支持 5 GHz），收不到 433 MHz、HF 或卫星信号。', en: 'Limited bands: around 2.4 GHz only (plus 5 GHz on ESP32-C5). No HF, 433 MHz or satellite reception.'},
  'help.limits.3': {zh: '增益与功率未标定：dBFS 数值是相对值，不能当作绝对功率计量。', en: 'Uncalibrated: dBFS values are relative, not absolute power measurements.'},
  'help.limits.4': {zh: '仅接收：项目不提供发射实现。接收本身一般无需许可，但发射或干扰在多数地区违法。', en: 'Receive only: no transmitter is provided. Reception is generally licence-free; transmitting or jamming is illegal in most regions.'},
  'help.limits.5': {zh: '需要桌面浏览器：WebSerial 只在 Chrome、Edge、Firefox 桌面版可用，并且必须通过 HTTPS 或 localhost 打开。', en: 'Desktop browser required: WebSerial needs desktop Chrome, Edge or Firefox over HTTPS or localhost.'},
  'help.faq.h': {zh: '常见问题', en: 'Troubleshooting'},
  'help.faq.q1': {zh: '连接失败或一直显示「未连接」？', en: 'Connection fails?'},
  'help.faq.a1': {zh: '确认没有别的程序占用串口（串口监视器、esptool、其他 SDR 软件）；确认已刷入 ESP-SDR 固件；插拔一次让板子复位；必要时按住 BOOT 再插入以进入下载模式重新刷写。', en: 'Close other programs holding the port, check that ESP-SDR firmware is installed, replug the board, or hold BOOT while connecting to re-flash.'},
  'help.faq.q2': {zh: '出现 CRC 错误或采样丢失？', en: 'CRC errors or dropped samples?'},
  'help.faq.a2': {zh: '页面会自动提示。降低采样率、减小 FFT 频点数、换用原生 USB 口、或按提示切换到 1 MBaud 串口速率通常都能改善。', en: 'Lower the sample rate, reduce FFT bins, use the native USB port, or switch to 1 MBaud when prompted.'},
  'help.faq.q3': {zh: '频谱只有一条中间尖峰、看不到信号？', en: 'Only a central spike?'},
  'help.faq.a3': {zh: '那是零中频的直流泄漏，正常现象。点击频谱或瀑布图可以把关注频率移开 0 Hz，也可以在「零中频处理」里选择填充 DC 频点。', en: 'That is the zero-IF DC leakage. Click the spectrum to move the tuned frequency off 0 Hz, or fill the DC bins.'},
  'help.faq.q4': {zh: '支持哪些芯片？', en: 'Which chips are supported?'},
  'help.faq.a4': {zh: 'ESP32、ESP32-S2、ESP32-S3、ESP32-C2/C3/C5/C6/C61、ESP32-H2、ESP32-S31 均可刷入 ESP-SDR；具体可用采样率、带宽与片上频谱能力由固件协商决定。', en: 'ESP32, ESP32-S2, ESP32-S3, ESP32-C2/C3/C5/C6/C61, ESP32-H2 and ESP32-S31. The available rates, bandwidth and on-chip spectrum profiles are negotiated with the firmware.'},
  'help.faq.q5': {zh: '中间出现一块 20 MHz 宽的平坦台地？', en: 'A flat 20 MHz-wide plateau in the middle?'},
  'help.faq.a5': {zh: '那不是信号，是接收通道的模拟滤波器通带。当「模拟带宽」比「采样率 / 名义跨度」窄时，两侧会被接收机自己削掉，只剩中间这一条。判据：改中心频率它跟着走、改模拟带宽它的边缘跟着动，就是滤波器；勾选「全开」即可看到整个跨度。', en: 'That is the analog filter passband, not a signal. When the analog bandwidth is narrower than the sample span the receiver cuts off both sides itself, leaving only the middle. Test: it follows the center frequency and its edges move with the bandwidth setting; tick "Wide open" to see the whole span.'},
  'help.faq.q6': {zh: '怎么看信号占的是哪个 WiFi 信道？', en: 'Which WiFi channel is a signal using?'},
  'help.faq.a6': {zh: '打开「显示 2.4G WiFi 信道」，频谱上会按 20 MHz 画出信道 1–14 并标号，1/6/11 高亮（唯一互不重叠的组合）。信号压在哪条色带里就是哪个信道；鼠标悬停与「中心」读数也会直接报出信道号。', en: 'Enable "Show 2.4 GHz WiFi channels": the spectrum gets 20 MHz-wide bands for channels 1–14 with numbers, with 1/6/11 highlighted (the only non-overlapping set). The band a signal sits in is its channel; hovering and the Center readout also report the channel number.'},
  'help.about.h': {zh: '关于本页', en: 'About this page'},
  'help.about.p': {zh: '本页是上游项目 esp-web-sdr 的中文增强版：补上了中文界面、每个控件的说明和这份指南，无线电协议与信号处理逻辑未做改动。上游项目由 ESPARGOS 团队以 GPL-3.0-or-later 发布。', en: 'This page is a Chinese-enhanced fork of the upstream esp-web-sdr project: it adds a Chinese interface, per-control explanations and this guide. The radio protocol and signal processing are unchanged. Upstream is released by the ESPARGOS team under GPL-3.0-or-later.'},

};

/* -------------------------------------------------------------- 语言状态 */
let espSdrLang = (() => {
  try {
    const v = localStorage.getItem('espSdrLang');
    if (v === 'en' || v === 'zh') return v;
  } catch (e) { /* 隐私模式下 localStorage 可能不可用 */ }
  return 'zh';
})();

/* 取翻译：优先当前语言，其次调用方给的英文原文，最后才是 key 本身。 */
function T(key, fallback, params) {
  const entry = I18N[key];
  let text = entry ? entry[espSdrLang] : undefined;
  if (text === undefined) text = fallback !== undefined ? fallback : (entry ? entry.zh : key);
  if (params) for (const name in params) text = text.split('{' + name + '}').join(params[name]);
  return text;
}

function currentLang() { return espSdrLang; }

/* 批量替换静态节点：文本、title、aria-label、气泡提示。 */
function applyI18n(root) {
  const scope = root || document;
  for (const node of scope.querySelectorAll('[data-i18n]')) node.textContent = T(node.dataset.i18n);
  for (const node of scope.querySelectorAll('[data-i18n-title]')) node.title = T(node.dataset.i18nTitle);
  for (const node of scope.querySelectorAll('[data-i18n-aria]')) node.setAttribute('aria-label', T(node.dataset.i18nAria));
  for (const node of scope.querySelectorAll('[data-i18n-tip]')) node.dataset.tip = T(node.dataset.i18nTip);
  for (const node of scope.querySelectorAll('[data-i18n-html]')) node.innerHTML = T(node.dataset.i18nHtml);
  document.documentElement.lang = espSdrLang === 'en' ? 'en' : 'zh-CN';
  // 只改本页自己声明了 data-i18n 的标题（查看器与刷写页各有各的标题）
  const titleEl = document.querySelector('title[data-i18n]');
  if (titleEl) titleEl.textContent = T(titleEl.dataset.i18n);
  const toggle = document.getElementById('langToggle');
  if (toggle) {
    toggle.textContent = T('header.lang');
    toggle.title = T('header.langTitle');
  }
}

/* 切换语言：静态节点重刷，动态文案交给各模块注册的 refreshTexts 回调。 */
function setLanguage(lang) {
  espSdrLang = lang === 'en' ? 'en' : 'zh';
  try { localStorage.setItem('espSdrLang', espSdrLang); } catch (e) { /* 忽略 */ }
  applyI18n(document);
  if (typeof window !== 'undefined' && typeof window.refreshTexts === 'function') window.refreshTexts();
}

function toggleLanguage() { setLanguage(espSdrLang === 'zh' ? 'en' : 'zh'); }

if (typeof window !== 'undefined') {
  window.T = T;
  window.setLanguage = setLanguage;
  window.toggleLanguage = toggleLanguage;
  window.currentLang = currentLang;
  window.applyI18n = applyI18n;
}
