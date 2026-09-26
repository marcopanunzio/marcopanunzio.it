import { useEffect, useState } from 'react';

type Props = { timezone: string; city: string };

/** Ora locale di Roma, aggiornata ogni secondo. */
export default function Clock({ timezone, city }: Props) {
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('it-IT', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <span className="label tabular-nums">
      {city} <span className="inline-block w-[8ch]">{time}</span>
    </span>
  );
}
