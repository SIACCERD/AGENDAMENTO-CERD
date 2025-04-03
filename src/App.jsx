import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
} from "firebase/firestore";
import app from "./firebaseConfig.jsx"; // Importa a configuração do Firebase
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./styles.css";

const db = getFirestore(app); // Inicializa o Firestore
const appointmentsCollection = collection(db, "appointments");

const viaturas = [
    "ABTS 032",
    "AF 002",
    "AF 005",
    "AF 007",
    "AG 002",
    "AG 003",
    "ARE 001",
    "AU 002",
    "AU 003",
    "AU 137",
    "AU 184",
    "AU 185",
    "TE 093",
    "MT 031",
    "MT 056",
    "MT 060",
];

const motoristas = {
    "CAP MARINHO": "2981793",
    "TEN TADEU": "898950",
    "TEN MAX": "901500",
    "TEN RENILDO": "901584",
    "TEN ALMEIDA": "4207173",
    "SGT BONGIOVANI": "2777665",
    "SGT ADAIR": "2778696",
    "SGT LENKE": "2177096",
    "SGT ANTUNES": "3037142",
    "SGT DUARTE": "3036871",
    "SGT THIAGO COELHO": "2946726",
    "SGT FELIPE GUIMARAES": "2754665",
    "SGT MILHOLO": "2984555",
    "SGT VICENTINI": "3370542",
    "SGT LEAO": "2805367",
    "SGT PITTOL": "3132378",
    "CB ARRUDA": "3270874",
    "CB DOS ANJOS": "3270646",
    "CB GLEIDSON": "3477470",
    "CB ALEX ROCHA": "3670210",
    "CB MAGESCHI": "3669742",
    "CB LAYONS": "3669602",
    "CB WESLEY AGUIAR": "3477770",
    "CB STORCH": "4151399",
    "SD FLAVIO AUGUSTO": "4151224",
    "SD LUCAS ROCHA": "2889416",
    "SD GUIZAN": "4190734",
    "SD ZANINI": "4757114",
    "SD LOPES COSTA": "4757548",
};

const senhaAdmin = "1106";
const horarios = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

const App = () => {
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");

    useEffect(() => {
        const fetchAppointments = async () => {
            const querySnapshot = await getDocs(appointmentsCollection);
            const data = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                date: new Date(doc.data().date),
            }));
            setAppointments(data);
        };
        fetchAppointments();
    }, [date]);

    const solicitarSenha = (motorista) => {
        const senhaInserida = prompt("DIGITE SEU NÚMERO FUNCIONAL:");
        return (
            senhaInserida === senhaAdmin ||
            senhaInserida === motoristas[motorista]
        );
    };

    const verificarDisponibilidade = (vehicle) => {
        return !appointments.some(
            (a) =>
                a.date.toDateString() === date.toDateString() &&
                a.vehicle === vehicle &&
                ((horaInicio >= a.horaInicio && horaInicio < a.horaFim) ||
                    (horaFim > a.horaInicio && horaFim <= a.horaFim)),
        );
    };

    const handleConfirm = async (vehicle) => {
        if (!selectedDriver || !horaInicio || !horaFim) {
            alert("Por favor, selecione todas as opções para agendar.");
            return;
        }
        if (!solicitarSenha(selectedDriver)) {
            alert("Senha incorreta!");
            return;
        }
        if (!verificarDisponibilidade(vehicle)) {
            alert("Este veículo já está agendado para este horário!");
            return;
        }
        const newAppointment = {
            date: date.toISOString(),
            horaInicio,
            horaFim,
            vehicle,
            driverName: selectedDriver,
        };
        const docRef = await addDoc(appointmentsCollection, newAppointment);
        setAppointments([
            ...appointments,
            { id: docRef.id, ...newAppointment, date },
        ]);
    };

    const handleCancel = async (id) => {
        const appointment = appointments.find((a) => a.id === id);
        if (!solicitarSenha(appointment.driverName)) {
            alert("Senha incorreta!");
            return;
        }
        await deleteDoc(doc(db, "appointments", id));
        setAppointments(appointments.filter((a) => a.id !== id));
    };

    return (
        <div className="container">
            <h1 className="title">
                AGENDAMENTO DE VIATURAS
                <br />
                CERD
            </h1>
            <div className="calendar-container">
                <Calendar
                    onChange={setDate}
                    value={date}
                    formatShortWeekday={(locale, date) =>
                        ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][
                            date.getDay()
                        ]
                    }
                />
            </div>
            <div className="form-group">
                <label>
                    MOTORISTA:
                    <select onChange={(e) => setSelectedDriver(e.target.value)}>
                        <option value="">Selecione</option>
                        {Object.keys(motoristas).map((motorista) => (
                            <option key={motorista} value={motorista}>
                                {motorista}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    HORA DE INÍCIO:
                    <select onChange={(e) => setHoraInicio(e.target.value)}>
                        <option value="">Selecione</option>
                        {horarios.map((h) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    HORA DE TÉRMINO:
                    <select onChange={(e) => setHoraFim(e.target.value)}>
                        <option value="">Selecione</option>
                        {horarios.map((h) => (
                            <option key={h} value={h}>
                                {h}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <h2 className="viaturas-title">VIATURAS DISPONÍVEIS</h2>
            <div className="viaturas-grid">
                {viaturas.map((viatura) => (
                    <button
                        key={viatura}
                        className={`viatura-button ${verificarDisponibilidade(viatura) ? "" : "indisponivel"}`}
                        onClick={() => handleConfirm(viatura)}
                        disabled={!verificarDisponibilidade(viatura)}
                    >
                        {viatura}
                    </button>
                ))}
            </div>
            <h2 className="agendamentos-title">AGENDAMENTOS DO DIA</h2>
            <ul className="agendamentos-list">
                {appointments
                    .filter(
                        (a) => a.date.toDateString() === date.toDateString(),
                    )
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                    .map((appointment) => (
                        <li key={appointment.id} className="agendamento-item">
                            {appointment.vehicle} - {appointment.driverName} (
                            {appointment.horaInicio} - {appointment.horaFim})
                            <button
                                onClick={() => handleCancel(appointment.id)}
                            >
                                Cancelar
                            </button>
                        </li>
                    ))}
            </ul>
        </div>
    );
};

export default App;
