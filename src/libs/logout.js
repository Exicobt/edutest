import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Swal from "sweetalert2";

export const handleLogout = () => {
    Swal.fire({
        title: "",
        text: "Apakah anda yakin ingin logout?",
        showConfirmButton: true,
        confirmButtonText: "Yes"
    }).then(result => {
        if(result.isConfirmed) {
            signOut(auth)
        }
    })
}