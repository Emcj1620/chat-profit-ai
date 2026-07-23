import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  makeStyles,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  Typography,
  Card,
  CardContent,
  Grid
} from "@material-ui/core";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  SettingsEthernet as FlowIcon
} from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    padding: theme.spacing(4),
    minHeight: "100vh",
    backgroundColor: theme.palette.background.default
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(4)
  },
  titleContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2)
  },
  iconHeader: {
    fontSize: "2.5rem",
    color: theme.palette.primary.main
  },
  paper: {
    borderRadius: theme.spacing(2),
    overflow: "hidden",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
    border: `1px solid ${theme.palette.divider}`,
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)"
  },
  createButton: {
    borderRadius: theme.spacing(1.5),
    textTransform: "none",
    padding: "10px 20px",
    fontWeight: "bold",
    boxShadow: "0 4px 14px 0 rgba(0, 125, 254, 0.3)"
  },
  actionButton: {
    marginRight: theme.spacing(1)
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold"
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32"
  },
  statusInactive: {
    backgroundColor: "#FFEBEE",
    color: "#C62828"
  }
}));

const ChatFlows = () => {
  const classes = useStyles();
  const history = useHistory();

  const [flows, setFlows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [editingFlow, setEditingFlow] = useState(null);

  // Fetch flows from backend
  const fetchFlows = async () => {
    try {
      const { data } = await api.get("/chatflows");
      setFlows(data);
    } catch (err) {
      toast.error("Erro ao carregar fluxos de conversa.");
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleOpenCreate = () => {
    setEditingFlow(null);
    setFlowName("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (flow) => {
    setEditingFlow(flow);
    setFlowName(flow.name);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!flowName.trim()) return;

    try {
      if (editingFlow) {
        // Update flow name
        await api.put(`/chatflows/${editingFlow.id}`, { name: flowName });
        toast.success("Fluxo renomeado com sucesso!");
      } else {
        // Create new flow and redirect to FlowBuilder canvas
        const { data } = await api.post("/chatflows", { name: flowName });
        toast.success("Fluxo criado! Redirecionando para o construtor...");
        history.push(`/flowbuilder/${data.id}`);
        return;
      }
      fetchFlows();
      handleCloseDialog();
    } catch (err) {
      toast.error("Erro ao salvar fluxo.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este fluxo de conversa?")) return;
    try {
      await api.delete(`/chatflows/${id}`);
      toast.success("Fluxo excluído com sucesso!");
      fetchFlows();
    } catch (err) {
      toast.error("Erro ao excluir fluxo.");
    }
  };

  const handleToggleActive = async (flow) => {
    try {
      await api.put(`/chatflows/${flow.id}`, { isActive: !flow.isActive });
      toast.success(flow.isActive ? "Fluxo desativado!" : "Fluxo ativado!");
      fetchFlows();
    } catch (err) {
      toast.error("Erro ao alterar status do fluxo.");
    }
  };

  const handleOpenBuilder = (id) => {
    history.push(`/flowbuilder/${id}`);
  };

  return (
    <div className={classes.mainContainer}>
      <div className={classes.header}>
        <div className={classes.titleContainer}>
          <FlowIcon className={classes.iconHeader} />
          <div>
            <Typography variant="h4" style={{ fontWeight: "bold" }}>
              Fluxos de Conversa
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Crie chatbots inteligentes e visuais arrastando blocos no estilo Typebot.
            </Typography>
          </div>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          className={classes.createButton}
          onClick={handleOpenCreate}
        >
          Novo Fluxo
        </Button>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TableContainer component={Paper} className={classes.paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ fontWeight: "bold" }}>Nome do Fluxo</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Criado Em</TableCell>
                  <TableCell style={{ fontWeight: "bold" }}>Última Atualização</TableCell>
                  <TableCell style={{ fontWeight: "bold", textAlign: "right" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell variant="body">{flow.name}</TableCell>
                    <TableCell>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                          <Switch
                            checked={flow.isActive}
                            onChange={() => handleToggleActive(flow)}
                            color="primary"
                          />
                        </Grid>
                        <Grid item>
                          <span
                            className={`${classes.statusBadge} ${
                              flow.isActive ? classes.statusActive : classes.statusInactive
                            }`}
                          >
                            {flow.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </Grid>
                      </Grid>
                    </TableCell>
                    <TableCell>
                      {new Date(flow.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {new Date(flow.updatedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      <IconButton
                        color="primary"
                        title="Construir Fluxo"
                        onClick={() => handleOpenBuilder(flow.id)}
                        className={classes.actionButton}
                      >
                        <PlayIcon />
                      </IconButton>
                      <IconButton
                        color="default"
                        title="Renomear"
                        onClick={() => handleOpenEdit(flow)}
                        className={classes.actionButton}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        title="Excluir"
                        onClick={() => handleDelete(flow.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {flows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} style={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body1" color="textSecondary" style={{ margin: "20px 0" }}>
                        Nenhum fluxo de conversa criado ainda. Clique em "Novo Fluxo" para começar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Create/Edit Name Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingFlow ? "Editar Nome do Fluxo" : "Criar Novo Fluxo de Conversa"}
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Nome do Fluxo"
              placeholder="Ex: Fluxo de Suporte Inicial"
              variant="outlined"
              fullWidth
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              required
              autoFocus
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Cancelar
            </Button>
            <Button type="submit" color="primary" variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default ChatFlows;
