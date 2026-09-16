import { useCallback } from "react";
import { AttendanceMovementLog } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { saveKioskAttendance } from "../application/hr/saveKioskAttendance";

export function useKioskAttendance() {
  const { state: authState } = useAuth();
  const companyId = authState.supabaseAuthUser?.companyId;

  const handleSaveMovementLog = useCallback(
    (log: AttendanceMovementLog) => {
      saveKioskAttendance(log, { companyId });
    },
    [companyId]
  );

  return {
    handleSaveMovementLog,
  };
}
