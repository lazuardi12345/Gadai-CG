import React, { useEffect } from 'react';
import { echo } from '../../echo';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationListener = () => {
    // Ambil user untuk filter notifikasi approval
    const user = JSON.parse(localStorage.getItem('user')); 
    const currentRole = user?.role?.toLowerCase();

    useEffect(() => {
        const channel = echo.channel('monitoring-transaksi');

        channel.listen('.notif.gadai', (data) => {
            
            if (data.status === 'Selesai') {
                toast.info(
                    <div>
                        <strong> UNIT SELESAI </strong>
                        <p style={{ fontSize: '12px', margin: 0 }}>{data.message}</p>
                    </div>, 
                    {
                        position: "top-right",
                        autoClose: false, 
                        theme: "colored",
                    }
                );
                playAudio('/sounds/notif-in.mp3'); 
            } 

            else if (data.status === 'Lunas') {
                toast.success(
                    <div>
                        <strong>UNIT LUNAS </strong>
                        <p style={{ fontSize: '12px', margin: 0 }}>{data.message}</p>
                    </div>, 
                    {
                        position: "top-right",
                        autoClose: false, 
                        theme: "dark",
                    }
                );
                playAudio('/sounds/notif-lunas.mp3'); 
            }
        });

        channel.listen('.notif.approval', (data) => {
            if (currentRole === data.target_role?.toLowerCase()) {
                toast.success( 
                    <div>
                        <strong>PERLU APPROVAL</strong>
                        <p style={{ fontSize: '12px', margin: 0 }}>{data.message}</p>
                        <small>No. Gadai: {data.no_gadai}</small>
                    </div>, 
                    {
                        position: "top-right", 
                        autoClose: 8000, 
                        theme: "colored", 
                    }
                );
                playAudio('/sounds/approval-notif.mp3');
            }
        });

        return () => {
            echo.leaveChannel('monitoring-transaksi');
        };
    }, [currentRole]);

    const playAudio = (url) => {
        const audio = new Audio(url);
        audio.play().catch(e => console.log("Izin audio diperlukan"));
    };

    return <ToastContainer limit={5} />;
};

export default NotificationListener;