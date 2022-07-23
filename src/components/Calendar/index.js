import React from 'react'
import FullCalendar from '@fullcalendar/react' // must go before plugins
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";

import { useRef } from "react";

const Calendar = () => {
  const calendarRef = useRef(null);
  return (
    <FullCalendar
      
      plugins={[timeGridPlugin, interactionPlugin]}
      editable
      selectable
    />
  );
};

export default Calendar;