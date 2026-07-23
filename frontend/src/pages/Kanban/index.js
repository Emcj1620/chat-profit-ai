import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";
import Avatar from "@material-ui/core/Avatar";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from "@material-ui/core/TextField";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import ChatIcon from "@material-ui/icons/Chat";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import ContactPhoneIcon from "@material-ui/icons/ContactPhone";

import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    height: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(3),
    width: "100%"
  },
  boardContainer: {
    display: "flex",
    gap: theme.spacing(2),
    overflowX: "auto",
    flex: 1,
    paddingBottom: theme.spacing(2),
    alignItems: "stretch"
  },
  column: {
    minWidth: 300,
    maxWidth: 320,
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    borderTop: "4px solid",
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(1.5),
    maxHeight: "calc(100vh - 180px)",
    boxShadow: theme.shadows[1]
  },
  columnHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2)
  },
  columnTitle: {
    fontWeight: "bold",
    textTransform: "uppercase"
  },
  cardsContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    paddingRight: theme.spacing(0.5)
  },
  card: {
    cursor: "grab",
    boxShadow: theme.shadows[1],
    transition: "transform 0.15s ease",
    "&:active": {
      cursor: "grabbing"
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[3]
    }
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing(1)
  },
  contactName: {
    fontWeight: 600,
    fontSize: "0.95rem"
  },
  phoneRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    fontSize: "0.8rem",
    marginBottom: theme.spacing(1)
  },
  lastMessage: {
    fontSize: "0.85rem",
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1.5),
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(1)
  },
  assignedUser: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    fontSize: "0.75rem",
    color: theme.palette.text.secondary
  },
  badge: {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.text.primary,
    fontSize: "0.75rem",
    padding: "2px 6px",
    borderRadius: 10,
    fontWeight: "bold"
  }
}));

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [manageStagesOpen, setManageStagesOpen] = useState(false);
  const [stageFormOpen, setStageFormOpen] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  
  // Form fields
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#2196F3");

  const fetchStages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/kanban/stages");
      setStages(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData("ticketId", ticketId);
  };

  const handleDrop = async (e, destStageId) => {
    const ticketId = e.dataTransfer.getData("ticketId");
    if (!ticketId) return;

    // Optimistic Update locally
    let sourceStage = null;
    let targetTicket = null;

    const updatedStages = stages.map(stage => {
      const ticketIndex = stage.tickets.findIndex(t => t.id === parseInt(ticketId));
      if (ticketIndex !== -1) {
        sourceStage = stage;
        targetTicket = stage.tickets[ticketIndex];
        const newTickets = [...stage.tickets];
        newTickets.splice(ticketIndex, 1);
        return { ...stage, tickets: newTickets };
      }
      return stage;
    });

    if (targetTicket) {
      const finalStages = updatedStages.map(stage => {
        if (stage.id === destStageId) {
          return { ...stage, tickets: [...stage.tickets, { ...targetTicket, kanbanStageId: destStageId }] };
        }
        return stage;
      });
      setStages(finalStages);
    }

    try {
      await api.put(`/tickets/${ticketId}/kanban`, { stageId: destStageId });
      toast.success("Lead atualizado com sucesso!");
    } catch (err) {
      toastError(err);
      fetchStages(); // Revert back on error
    }
  };

  // Manage Stages
  const handleOpenStageForm = (stage = null) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.name);
      setStageColor(stage.color);
    } else {
      setEditingStage(null);
      setStageName("");
      setStageColor("#2196F3");
    }
    setStageFormOpen(true);
  };

  const handleSaveStage = async () => {
    if (!stageName) {
      toast.error("O nome da etapa é obrigatório.");
      return;
    }

    try {
      if (editingStage) {
        await api.put(`/kanban/stages/${editingStage.id}`, {
          name: stageName,
          color: stageColor
        });
        toast.success("Etapa editada com sucesso!");
      } else {
        await api.post("/kanban/stages", {
          name: stageName,
          color: stageColor,
          position: stages.length + 1
        });
        toast.success("Nova etapa adicionada!");
      }
      fetchStages();
      setStageFormOpen(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm("Tem certeza que deseja excluir esta etapa? Os atendimentos nela retornarão ao painel geral.")) {
      return;
    }

    try {
      await api.delete(`/kanban/stages/${stageId}`);
      toast.success("Etapa excluída!");
      fetchStages();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div>
          <Typography variant="h5" style={{ fontWeight: "bold" }}>
            Quadro Kanban (CRM)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Organize seus contatos e negociações arrastando os cartões entre as colunas.
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setManageStagesOpen(true)}
          style={{ textTransform: "none" }}
        >
          Gerenciar Etapas
        </Button>
      </div>

      <div className={classes.boardContainer}>
        {stages.map(stage => (
          <div
            key={stage.id}
            className={classes.column}
            style={{ borderColor: stage.color }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className={classes.columnHeader}>
              <Typography variant="subtitle2" className={classes.columnTitle} style={{ color: stage.color }}>
                {stage.name}
              </Typography>
              <span className={classes.badge}>
                {stage.tickets?.length || 0}
              </span>
            </div>
            
            <div className={classes.cardsContainer}>
              {stage.tickets?.map(ticket => (
                <Card
                  key={ticket.id}
                  className={classes.card}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ticket.id)}
                >
                  <CardContent style={{ padding: "12px 16px" }}>
                    <div className={classes.cardHeader}>
                      <Typography variant="subtitle2" className={classes.contactName}>
                        {ticket.contact?.name || "Sem Nome"}
                      </Typography>
                    </div>

                    <div className={classes.phoneRow}>
                      <ContactPhoneIcon style={{ fontSize: 14 }} />
                      <span>{ticket.contact?.number}</span>
                    </div>

                    <Typography variant="body2" className={classes.lastMessage}>
                      {ticket.lastMessage || "Nenhuma mensagem enviada."}
                    </Typography>

                    <div className={classes.cardFooter}>
                      <div className={classes.assignedUser}>
                        <AccountCircleIcon style={{ fontSize: 16 }} />
                        <span>{ticket.user?.name || "Sem responsável"}</span>
                      </div>
                      
                      <Tooltip title="Abrir Conversa">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => history.push(`/tickets/${ticket.id}`)}
                        >
                          <ChatIcon style={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gerenciar Etapas Dialog */}
      <Dialog
        open={manageStagesOpen}
        onClose={() => setManageStagesOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle style={{ fontWeight: "bold" }}>
          Etapas do Funil de Vendas
        </DialogTitle>
        <DialogContent dividers>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => handleOpenStageForm()}
            style={{ marginBottom: 16, textTransform: "none" }}
          >
            Adicionar Etapa
          </Button>

          <List>
            {stages.map(stage => (
              <ListItem key={stage.id} button style={{ borderLeft: `4px solid ${stage.color}`, marginBottom: 8, borderRadius: 4 }}>
                <ListItemText
                  primary={stage.name}
                  secondary={`Cor: ${stage.color}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" color="primary" onClick={() => handleOpenStageForm(stage)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" color="secondary" onClick={() => handleDeleteStage(stage.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageStagesOpen(false)} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adicionar / Editar Etapa Form */}
      <Dialog open={stageFormOpen} onClose={() => setStageFormOpen(false)}>
        <DialogTitle style={{ fontWeight: "bold" }}>
          {editingStage ? "Editar Etapa" : "Nova Etapa"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Etapa"
            type="text"
            fullWidth
            variant="outlined"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <TextField
            margin="dense"
            label="Cor (Código Hexadecimal)"
            type="color"
            fullWidth
            variant="outlined"
            value={stageColor}
            onChange={(e) => setStageColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStageFormOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSaveStage} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Kanban;
