import { useContext } from "react";
import { AdminContext } from "./AdminContext.jsx";

export const useAdmin = () => {
    return useContext(AdminContext);
};
