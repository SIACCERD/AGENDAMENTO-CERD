import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./styles.css";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
} from "firebase/firestore";
import app from "./firebaseConfig.jsx";

const db = getFirestore(app);

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
const horarios = Array.from({ length: 29 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minutes}`;
});

const App = () => {
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [indisponiveis, setIndisponiveis] = useState([]);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [tipoAgendamento, setTipoAgendamento] = useState("horario");
    const [numDias, setNumDias] = useState(1);
    const [viaturaIndisponivel, setViaturaIndisponivel] = useState("");
    const [motivoIndisponibilidade, setMotivoIndisponibilidade] = useState("");
    const [selectedDriver, setSelectedDriver] = useState("");
    const [horaInicio, setHoraInicio] = useState("");
    const [horaFim, setHoraFim] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            const appointmentsCollection = collection(db, "appointments");
            const indisponiveisCollection = collection(
                db,
                "indisponibilidades",
            );

            const agendamentosSnap = await getDocs(appointmentsCollection);
            const indisponiveisSnap = await getDocs(indisponiveisCollection);

            const dadosAgendamentos = agendamentosSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                date: new Date(doc.data().date),
            }));
            const dadosIndisponiveis = indisponiveisSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setAppointments(dadosAgendamentos);
            setIndisponiveis(dadosIndisponiveis);
        };
        fetchData();
    }, [date]);

    const solicitarSenha = (motorista) => {
        const senhaInserida = prompt("DIGITE SEU NÚMERO FUNCIONAL:");
        return (
            senhaInserida === senhaAdmin ||
            senhaInserida === motoristas[motorista]
        );
    };

    const solicitarSenhaAdmin = () => {
        const senha = prompt("DIGITE A SENHA DE ADMINISTRADOR:");
        return senha === senhaAdmin;
    };

    const verificarDisponibilidade = (vehicle, checkDate = date) => {
        const agendado = appointments.some(
            (a) =>
                a.date.toDateString() === checkDate.toDateString() &&
                a.vehicle === vehicle &&
                ((horaInicio >= a.horaInicio && horaInicio < a.horaFim) ||
                    (horaFim > a.horaInicio && horaFim <= a.horaFim)),
        );
        const indisponivel = indisponiveis.some((i) => i.vehicle === vehicle);
        return !agendado && !indisponivel;
    };

    const handleIndisponibilizar = async () => {
        if (!viaturaIndisponivel) {
            alert("Selecione a viatura a ser indisponibilizada.");
            return;
        }

        const senhaAdminInserida = prompt("DIGITE A SENHA DE ADMINISTRADOR:");
        if (senhaAdminInserida !== senhaAdmin) {
            alert("Senha incorreta!");
            return;
        }

        const indisponiveisCollection = collection(db, "indisponibilidades");
        await addDoc(indisponiveisCollection, {
            vehicle: viaturaIndisponivel,
            motivo: motivoIndisponibilidade,
            data: new Date().toISOString(),
        });

        setIndisponiveis([
            ...indisponiveis,
            {
                vehicle: viaturaIndisponivel,
                motivo: motivoIndisponibilidade,
                data: new Date().toISOString(),
            },
        ]);
        setViaturaIndisponivel("");
        setMotivoIndisponibilidade("");
    };

    const handleRemoverIndisponibilidade = async (id) => {
        const senhaAdminInserida = prompt("DIGITE A SENHA DE ADMINISTRADOR:");

        if (senhaAdminInserida !== senhaAdmin) {
            alert("Senha incorreta!");
            return;
        }

        const indisponiveisCollection = collection(db, "indisponibilidades");
        await deleteDoc(doc(db, "indisponibilidades", id));
        setIndisponiveis(indisponiveis.filter((i) => i.id !== id));
    };

    const handleConfirm = async (vehicle) => {
        if (!selectedDriver) {
            alert("Por favor, selecione o motorista.");
            return;
        }
        if (tipoAgendamento === "horario" && (!horaInicio || !horaFim)) {
            alert("Selecione início e fim.");
            return;
        }

        if (!solicitarSenha(selectedDriver)) {
            alert("Número funcional incorreto!");
            return;
        }

        if (tipoAgendamento === "variosDias") {
            const startDate = new Date(date);
            for (let i = 0; i < numDias; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                if (!verificarDisponibilidade(vehicle, currentDate)) {
                    alert(
                        `Viatura indisponível em ${currentDate.toLocaleDateString()}`,
                    );
                    return;
                }

                const newAppointment = {
                    date: currentDate.toISOString(),
                    horaInicio: "06:00", // Dia inteiro
                    horaFim: "20:30", // Dia inteiro
                    vehicle,
                    driverName: selectedDriver,
                };

                const appointmentsCollection = collection(db, "appointments");
                const docRef = await addDoc(
                    appointmentsCollection,
                    newAppointment,
                );
                setAppointments([
                    ...appointments,
                    { id: docRef.id, ...newAppointment, date: currentDate },
                ]);
            }
        } else {
            if (!verificarDisponibilidade(vehicle, date)) {
                alert("Veículo indisponível!");
                return;
            }
            const newAppointment = {
                date: date.toISOString(),
                horaInicio,
                horaFim,
                vehicle,
                driverName: selectedDriver,
            };

            const appointmentsCollection = collection(db, "appointments");
            const docRef = await addDoc(appointmentsCollection, newAppointment);
            setAppointments([
                ...appointments,
                { id: docRef.id, ...newAppointment, date },
            ]);
        }
    };

    const isMultipleDayAppointment = (appointment) => {
        const agendamentosDoVeiculo = appointments.filter(
            (a) =>
                a.vehicle === appointment.vehicle &&
                a.driverName === appointment.driverName,
        );
        return agendamentosDoVeiculo.length > 1; // Se houver mais de um agendamento para o mesmo veículo e motorista, é um agendamento de múltiplos dias
    };

    const handleCancel = async (id) => {
        const agendamento = appointments.find((a) => a.id === id);
        if (!agendamento) return;

        const senhaInserida = prompt("DIGITE SEU NÚMERO FUNCIONAL:");
        if (
            senhaInserida === senhaAdmin ||
            senhaInserida === motoristas[agendamento.driverName]
        ) {
            if (isMultipleDayAppointment(agendamento)) {
                const cancelarTodos = window.confirm(
                    "Este agendamento faz parte de um agendamento de múltiplos dias. Deseja cancelar todos os agendamentos relacionados?",
                );

                if (cancelarTodos) {
                    // Lógica para cancelar todos os agendamentos relacionados
                    const appointmentsToCancel = appointments.filter(
                        (a) =>
                            a.vehicle === agendamento.vehicle &&
                            a.driverName === agendamento.driverName,
                    );

                    for (const appointment of appointmentsToCancel) {
                        const appointmentsCollection = collection(
                            db,
                            "appointments",
                        );
                        await deleteDoc(
                            doc(db, "appointments", appointment.id),
                        );
                        setAppointments(
                            appointments.filter((a) => a.id !== appointment.id),
                        );
                    }
                    alert(
                        "Todos os agendamentos relacionados foram cancelados!",
                    );
                } else {
                    // Lógica para cancelar apenas o agendamento atual
                    const appointmentsCollection = collection(
                        db,
                        "appointments",
                    );
                    await deleteDoc(doc(db, "appointments", id));
                    setAppointments(appointments.filter((a) => a.id !== id));
                    alert("Agendamento cancelado!");
                }
            } else {
                // Lógica para cancelar apenas o agendamento atual
                const appointmentsCollection = collection(db, "appointments");
                await deleteDoc(doc(db, "appointments", id));
                setAppointments(appointments.filter((a) => a.id !== id));
                alert("Agendamento cancelado!");
            }
        } else {
            alert("Número funcional incorreto!");
        }
    };

    const handleTipoAgendamentoChange = (tipo) => {
        setTipoAgendamento(tipo);
    };

    return (
        <div className="container">
            <h1 className="title">
                AGENDAMENTO DE VIATURAS
                <br />
                <span className="logo-cerd">CERD</span>
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

            {/* Formulário de Agendamento */}
            <div className="form-group">
                <label>
                    MOTORISTA:
                    <select
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        value={selectedDriver}
                        required
                    >
                        <option value="">Selecione</option>
                        {Object.keys(motoristas).map((motorista) => (
                            <option key={motorista} value={motorista}>
                                {motorista}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Checkboxes para tipos de agendamento */}
            <div className="checkbox-group">
                <label>
                    <input
                        type="radio"
                        value="horario"
                        checked={tipoAgendamento === "horario"}
                        onChange={() => handleTipoAgendamentoChange("horario")}
                    />
                    Horário
                </label>
                <label>
                    <input
                        type="radio"
                        value="diaInteiro"
                        checked={tipoAgendamento === "diaInteiro"}
                        onChange={() =>
                            handleTipoAgendamentoChange("diaInteiro")
                        }
                    />
                    Dia Inteiro
                </label>
                <label>
                    <input
                        type="radio"
                        value="variosDias"
                        checked={tipoAgendamento === "variosDias"}
                        onChange={() =>
                            handleTipoAgendamentoChange("variosDias")
                        }
                    />
                    Vários Dias
                </label>
            </div>

            {tipoAgendamento === "horario" && (
                <div className="form-group">
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
            )}

            {tipoAgendamento === "variosDias" && (
                <div className="form-group">
                    <label>
                        QUANTOS DIAS?
                        <input
                            type="number"
                            value={numDias}
                            onChange={(e) =>
                                setNumDias(parseInt(e.target.value, 10))
                            }
                            className="num-dias-input"
                        />
                    </label>
                </div>
            )}

            <h2 className="viaturas-title">VIATURAS DISPONÍVEIS</h2>
            <div className="viaturas-grid">
                {viaturas.map((viatura) => {
                    const indisponivel = indisponiveis.some(
                        (i) => i.vehicle === viatura,
                    );
                    return (
                        <button
                            key={viatura}
                            className={`viatura-button ${
                                verificarDisponibilidade(viatura)
                                    ? ""
                                    : "indisponivel"
                            } ${indisponivel ? "vermelho" : ""}`}
                            onClick={() => handleConfirm(viatura)}
                            disabled={!verificarDisponibilidade(viatura)}
                        >
                            {viatura}
                        </button>
                    );
                })}
            </div>

            {/* Lista de Agendamentos do Dia */}
            <h2 className="agendamentos-title">AGENDAMENTOS DO DIA</h2>
            <div className="agendamentos-container">
                <ul className="agendamentos-list">
                    {appointments
                        .filter(
                            (a) =>
                                a.date.toDateString() === date.toDateString(),
                        )
                        .sort((a, b) =>
                            a.horaInicio.localeCompare(b.horaInicio),
                        )
                        .map((a) => (
                            <li key={a.id} className="agendamento-item">
                                {a.vehicle} - {a.driverName} ({a.horaInicio} -{" "}
                                {a.horaFim})
                                <button onClick={() => handleCancel(a.id)}>
                                    Cancelar
                                </button>
                            </li>
                        ))}
                </ul>
            </div>

            {/* Lista de Viaturas Indisponíveis */}
            {indisponiveis.length > 0 && (
                <>
                    <h2 className="agendamentos-title">
                        VIATURAS INDISPONÍVEIS
                    </h2>
                    <ul className="indisponiveis-list">
                        {indisponiveis.map((i) => (
                            <li key={i.id || i.vehicle}>
                                {i.vehicle} -{" "}
                                {new Date(i.data).toLocaleDateString()} -{" "}
                                {i.motivo}
                                <button
                                    onClick={() =>
                                        handleRemoverIndisponibilidade(i.id)
                                    }
                                >
                                    Disponibilizar
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Indisponibilizar Viatura */}
            <div className="indisponibilizar-container">
                <h2 className="indisponibilidade-title">
                    INDISPONIBILIZAR VIATURA
                </h2>
                <div className="indisponibilizar-section">
                    <label>
                        Viatura:
                        <select
                            value={viaturaIndisponivel}
                            onChange={(e) =>
                                setViaturaIndisponivel(e.target.value)
                            }
                        >
                            <option value="">Selecione</option>
                            {viaturas.map((viatura) => (
                                <option key={viatura} value={viatura}>
                                    {viatura}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Motivo:
                        <input
                            type="text"
                            value={motivoIndisponibilidade}
                            onChange={(e) =>
                                setMotivoIndisponibilidade(e.target.value)
                            }
                        />
                    </label>

                    <button onClick={handleIndisponibilizar}>
                        Indisponibilizar
                    </button>
                </div>
            </div>

            {feedbackMessage && (
                <div className="feedback">{feedbackMessage}</div>
            )}
        </div>
    );
};

export default App;
