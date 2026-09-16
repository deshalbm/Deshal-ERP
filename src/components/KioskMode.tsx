import React from "react";
import { AttendanceKioskModal, AttendanceKioskModalProps } from "./kiosk/AttendanceKioskModal";

export const KioskMode: React.FC<AttendanceKioskModalProps> = (props) => {
  return <AttendanceKioskModal {...props} />;
};

export default KioskMode;
