import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';



export default function Timer({ eventTime, interval }) {
    const [time, setTime] = useState(eventTime);

    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [difTime, setDifTime] = useState(0);
    const now_utc_date = new Date().toUTCString();
    const now_timestamp = new Date(now_utc_date).getTime();


    const calculateTimeLeft = () => {
        let diff_time = moment.duration(moment(now_timestamp).diff(moment(time*1000)));
        setDifTime(diff_time);
        let days = diff_time.days().toString().replace('-', '');
        let diff_hours = diff_time.hours().toString().replace('-', '') > 9 ? diff_time.hours().toString().replace('-', '') : `0${diff_time.hours().toString().replace('-', '')}`;
        let diff_minutes = diff_time.minutes().toString().replace('-', '') > 9 ? diff_time.minutes().toString().replace('-', '') : `0${diff_time.minutes().toString().replace('-', '')}`;
        let diff_seconds = diff_time.seconds().toString().replace('-', '') > 9 ? diff_time.seconds().toString().replace('-', '') : `0${diff_time.seconds().toString().replace('-', '')}`;
        return (
                  //
            
            `${days}d ${diff_hours}:${diff_minutes}:${diff_seconds}`
        );
    }

    const timerCallback = useCallback(() => {
        setTimeLeft(calculateTimeLeft());
        setTime(eventTime)
    }, [eventTime, now_timestamp]);

    useEffect(() => {
        let t = setInterval(timerCallback, interval);
        return () => clearInterval(t);

    }, [eventTime, interval, timerCallback]);

    return (
        <>
            {difTime > 0 ?
                <div className='btn-select'>00:00:00</div>
                :
                <div className='btn-select block-button'>{timeLeft}</div>

}
        </>
    )
}
