import React from "react";
import { AttendanceKioskModal, AttendanceKioskModalProps } from "./kiosk/AttendanceKioskModal";

export const KioskAttendanceModal: React.FC<AttendanceKioskModalProps> = (props) => {
  return <AttendanceKioskModal {...props} />;
};

export default KioskAttendanceModal;
