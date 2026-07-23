import React, { useState, useEffect, useContext } from "react";
import {
  Grid,
  Paper,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Box,
  LinearProgress,
  Chip,
  makeStyles
} from "@material-ui/core";
import {
  PlayArrow,
  Pause,
  Edit,
  Delete,
  Add,
  Send,
  People,
  HourglassEmpty,
  CheckCircle,
  ErrorOutline
} from "@material-ui/icons";
import { toast } from "react-toastify";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import api from "../../services/api";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import openSocket from "../../services/socket-io";
import toastError from "../../errors/toastError";

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  card: {
    height: "100%"
  },
  progress: {
    width: "100%",
    marginTop: theme.spacing(1)
  },
  formControl: {
    margin: theme.spacing(1, 0),
    width: "100%"
  },
  tabPanel: {
    padding: theme.spacing(2, 0)
  },
  actionsCell: {
    display: "flex",
    gap: theme.spacing(0.5)
  }
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`campaign-tabpanel-${index}`}
      aria-labelledby={`campaign-tab-${index}`}
      {...other}
    >
      {value === index && <Box py={2}>{children}</Box>}
    </div>
  );
}

const Campaigns = () => {
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);

  const [campaigns, setCampaigns] = useState([]);
  const [kanbanStages, setKanbanStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form State
  const [activeTab, setActiveTab] = useState(0);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [name, setName] = useState("");
  const [minDelay, setMinDelay] = useState(15);
  const [maxDelay, setMaxDelay] = useState(30);
  const [tagsToAdd, setTagsToAdd] = useState("");
  const [kanbanStageId, setKanbanStageId] = useState("");
  const [selectedWhatsappIds, setSelectedWhatsappIds] = useState([]);
  const [audienceSource, setAudienceSource] = useState("base");
  const [tagsFilter, setTagsFilter] = useState("");
  const [importedContacts, setImportedContacts] = useState("");
  
  // Templates state
  const [message1, setMessage1] = useState("");
  const [message2, setMessage2] = useState("");
  const [message3, setMessage3] = useState("");
  const [message4, setMessage4] = useState("");
  const [message5, setMessage5] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/campaigns");
      setCampaigns(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKanbanStages = async () => {
    try {
      const { data } = await api.get("/kanban/stages");
      setKanbanStages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchKanbanStages();
  }, []);

  useEffect(() => {
    const socket = openSocket();

    socket.on("campaign", data => {
      if (data.action === "update") {
        setCampaigns(prev => {
          const index = prev.findIndex(c => c.id === data.campaign.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = data.campaign;
            return updated;
          }
          return [data.campaign, ...prev];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCampaignId(null);
    setName("");
    setMinDelay(15);
    setMaxDelay(30);
    setTagsToAdd("");
    setKanbanStageId("");
    setSelectedWhatsappIds(whatsApps.map(w => w.id));
    setAudienceSource("base");
    setTagsFilter("");
    setImportedContacts("");
    setMessage1("");
    setMessage2("");
    setMessage3("");
    setMessage4("");
    setMessage5("");
    setActiveTab(0);
    setModalOpen(true);
  };

  const handleOpenEditModal = (campaign) => {
    setEditingCampaignId(campaign.id);
    setName(campaign.name);
    setMinDelay(campaign.minDelay);
    setMaxDelay(campaign.maxDelay);
    setTagsToAdd(campaign.tagsToAdd || "");
    setKanbanStageId(campaign.kanbanStageId || "");
    setSelectedWhatsappIds(campaign.whatsapps ? campaign.whatsapps.map(w => w.id) : []);
    setAudienceSource("base"); // edits target details metadata updates only
    setTagsFilter("");
    setImportedContacts("");
    setMessage1(campaign.message1 || "");
    setMessage2(campaign.message2 || "");
    setMessage3(campaign.message3 || "");
    setMessage4(campaign.message4 || "");
    setMessage5(campaign.message5 || "");
    setActiveTab(0);
    setModalOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (!name.trim()) {
      toast.error("Por favor, informe o nome da campanha.");
      return;
    }

    const payload = {
      name,
      minDelay,
      maxDelay,
      tagsToAdd,
      kanbanStageId: kanbanStageId || null,
      whatsappIds: selectedWhatsappIds,
      audienceSource,
      tagsFilter,
      importedContacts,
      message1,
      message2,
      message3,
      message4,
      message5
    };

    try {
      if (editingCampaignId) {
        await api.put(`/campaigns/${editingCampaignId}`, payload);
        toast.success("Campanha atualizada com sucesso!");
      } else {
        await api.post("/campaigns", payload);
        toast.success("Campanha criada com sucesso!");
      }
      setModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      toastError(err);
    }
  };

  const handleToggleCampaign = async (campaign) => {
    try {
      if (campaign.status === "running") {
        await api.post(`/campaigns/${campaign.id}/pause`);
        toast.info(`Campanha "${campaign.name}" pausada.`);
      } else {
        await api.post(`/campaigns/${campaign.id}/start`);
        toast.success(`Campanha "${campaign.name}" iniciada.`);
      }
      fetchCampaigns();
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/campaigns/${confirmDeleteId}`);
      toast.success("Campanha removida.");
      setConfirmDeleteId(null);
      fetchCampaigns();
    } catch (err) {
      toastError(err);
    }
  };

  const getStats = () => {
    const total = campaigns.length;
    const running = campaigns.filter(c => c.status === "running").length;
    const completed = campaigns.filter(c => c.status === "completed").length;
    return { total, running, completed };
  };

  const stats = getStats();

  const handleWhatsappCheckboxChange = (id) => {
    setSelectedWhatsappIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const renderProgress = (campaign) => {
    const contacts = campaign.contacts || [];
    const total = contacts.length;
    const sent = contacts.filter(c => c.status === "sent" || c.status === "failed").length;
    const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

    return (
      <div className={classes.progress}>
        <Typography variant="body2" color="textSecondary" align="right">
          {sent} / {total} ({percent}%)
        </Typography>
        <LinearProgress variant="determinate" value={percent} color="primary" />
      </div>
    );
  };

  const renderStatusBadge = (status) => {
    let color = "default";
    if (status === "running") color = "primary";
    if (status === "completed") color = "secondary";
    if (status === "paused") color = "default";
    return <Chip label={status.toUpperCase()} color={color} size="small" />;
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>Campanhas de Disparo</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenCreateModal}
            startIcon={<Add />}
          >
            Nova Campanha
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      {/* Statistics Cards */}
      <Grid container spacing={2} style={{ marginBottom: 16 }}>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Total Campanhas
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </div>
                <HourglassEmpty color="action" style={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Executando
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.running}
                  </Typography>
                </div>
                <Send color="primary" style={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className={classes.card}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="textSecondary" gutterBottom>
                    Finalizadas
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {stats.completed}
                  </Typography>
                </div>
                <CheckCircle color="secondary" style={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Intervalo (Delays)</TableCell>
              <TableCell>Progresso de Envio</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="textSecondary">
                    Nenhuma campanha cadastrada. Clique em "Nova Campanha" para iniciar!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map(campaign => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.name}</TableCell>
                  <TableCell align="center">
                    {renderStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell align="center">
                    {campaign.minDelay}s - {campaign.maxDelay}s
                  </TableCell>
                  <TableCell style={{ minWidth: 200 }}>
                    {renderProgress(campaign)}
                  </TableCell>
                  <TableCell align="center">
                    <div className={classes.actionsCell}>
                      {campaign.status !== "completed" && (
                        <IconButton
                          size="small"
                          color={campaign.status === "running" ? "secondary" : "primary"}
                          onClick={() => handleToggleCampaign(campaign)}
                        >
                          {campaign.status === "running" ? <Pause /> : <PlayArrow />}
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="default"
                        disabled={campaign.status === "running"}
                        onClick={() => handleOpenEditModal(campaign)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => setConfirmDeleteId(campaign.id)}
                      >
                        <Delete />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Campaign Dialog Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCampaignId ? "Editar Campanha" : "Nova Campanha de Disparo"}
        </DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Configurações" />
            <Tab label="Mensagens (Templates)" />
            <Tab label="Público Alvo" />
            <Tab label="Conexões (WhatsApp)" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Nome da Campanha"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Delay Mínimo (segundos)"
                  type="number"
                  value={minDelay}
                  onChange={e => setMinDelay(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Delay Máximo (segundos)"
                  type="number"
                  value={maxDelay}
                  onChange={e => setMaxDelay(Number(e.target.value))}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Adicionar Tags nos Contatos (separadas por vírgula)"
                  value={tagsToAdd}
                  onChange={e => setTagsToAdd(e.target.value)}
                  placeholder="ex: Cliente, Promo-Julho"
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" size="small" className={classes.formControl}>
                  <InputLabel id="kanban-select-label">Mover para Kanban</InputLabel>
                  <Select
                    labelId="kanban-select-label"
                    value={kanbanStageId}
                    onChange={e => setKanbanStageId(e.target.value)}
                    label="Mover para Kanban"
                  >
                    <MenuItem value="">
                      <em>Nenhum / Não adicionar</em>
                    </MenuItem>
                    {kanbanStages.map(stage => (
                      <MenuItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="caption" color="textSecondary" style={{ marginBottom: 8, display: "block" }}>
              Preencha até 5 mensagens. O sistema irá rotacionar as mensagens preenchidas aleatoriamente para cada cliente para evitar bloqueios. 
              Use <strong>{"{nome}"}</strong> para citar o nome do contato, ou <strong>{"{numero}"}</strong>.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem Principal (Variação 1)"
                  multiline
                  rows={3}
                  value={message1}
                  onChange={e => setMessage1(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem Opcional (Variação 2)"
                  multiline
                  rows={2}
                  value={message2}
                  onChange={e => setMessage2(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem Opcional (Variação 3)"
                  multiline
                  rows={2}
                  value={message3}
                  onChange={e => setMessage3(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem Opcional (Variação 4)"
                  multiline
                  rows={2}
                  value={message4}
                  onChange={e => setMessage4(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem Opcional (Variação 5)"
                  multiline
                  rows={2}
                  value={message5}
                  onChange={e => setMessage5(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {editingCampaignId ? (
              <Typography color="textSecondary">
                A lista de destinatários já foi configurada para esta campanha. Edição indisponível.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl variant="outlined" size="small" className={classes.formControl}>
                    <InputLabel id="audience-select-label">Origem do Público</InputLabel>
                    <Select
                      labelId="audience-select-label"
                      value={audienceSource}
                      onChange={e => setAudienceSource(e.target.value)}
                      label="Origem do Público"
                    >
                      <MenuItem value="base">Base de Contatos Atual</MenuItem>
                      <MenuItem value="import">Importar Lista de Números</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {audienceSource === "base" && (
                  <Grid item xs={12}>
                    <TextField
                      label="Filtrar Contatos por Tags (Vazio para enviar para toda a base)"
                      value={tagsFilter}
                      onChange={e => setTagsFilter(e.target.value)}
                      placeholder="ex: Lead, Interessado"
                      fullWidth
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                )}

                {audienceSource === "import" && (
                  <Grid item xs={12}>
                    <TextField
                      label="Lista de Números (Um por linha. Opcional: numero,nome)"
                      placeholder="554799999999, Joao Pires&#10;554788888888, Maria Clara&#10;5511977777777"
                      multiline
                      rows={6}
                      value={importedContacts}
                      onChange={e => setImportedContacts(e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                )}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Typography variant="caption" color="textSecondary" style={{ marginBottom: 8, display: "block" }}>
              Selecione quais conexões de WhatsApp deseja utilizar. A campanha irá rotacionar os disparos entre todas as conexões selecionadas que estiverem ativas e conectadas.
            </Typography>
            <Grid container spacing={1}>
              {whatsApps.length === 0 ? (
                <Grid item xs={12}>
                  <Typography color="secondary">
                    Nenhuma conexão de WhatsApp encontrada! Cadastre conexões na tela de Conexões primeiro.
                  </Typography>
                </Grid>
              ) : (
                whatsApps.map(w => (
                  <Grid item xs={12} sm={6} key={w.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedWhatsappIds.includes(w.id)}
                          onChange={() => handleWhatsappCheckboxChange(w.id)}
                          color="primary"
                        />
                      }
                      label={
                        <Box display="inline-flex" alignItems="center" gap={1}>
                          <Typography variant="body1">{w.name}</Typography>
                          <Chip
                            label={w.status}
                            color={w.status === "CONNECTED" ? "primary" : "default"}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="default">
            Cancelar
          </Button>
          <Button onClick={handleSaveCampaign} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta campanha? Essa ação irá apagar todo o histórico de disparos desta campanha permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)} color="default">
            Cancelar
          </Button>
          <Button onClick={handleDeleteCampaign} color="secondary" variant="contained">
            Excluir permanentemente
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default Campaigns;
