import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Chip,
  TextField,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Download,
  UploadFile,
  Delete,
  Search,
} from "@mui/icons-material";
import api from "../shared/utils/api";
import { useCanWrite } from "../shared/hooks/useCanWrite";

interface Country {
  name: string;
  code2: string;
  actorCount: number;
  fileName?: string | null;
}

const CountriesDashboard = () => {
  const canWrite = useCanWrite();
  const [search, setSearch] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  const handleUpload = async (
    countryCode: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!canWrite) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(
        `/countries/${countryCode}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await loadCountries();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleDownload = async (countryCode: string) => {
    try {
      const response = await api.get(`/countries/${countryCode}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers["content-disposition"]
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ?? `${countryCode}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDelete = async (countryCode: string) => {
    if (!canWrite) return;

    try {
      await api.delete(`/countries/${countryCode}/file`);
      await loadCountries();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const loadCountries = async () => {
    try {
      setLoading(true);

      const response = await api.get("/countries");

      if (response.data.success) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Países
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Gestión de documentos estratégicos por país
      </Typography>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <TextField
          size="small"
          placeholder="Buscar país..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: <Search sx={{ mr: 1 }} />,
            },
          }}
        />

        <Chip
          label={`${filteredCountries.length} países`}
          color="primary"
          variant="outlined"
        />
      </Stack>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>País</TableCell>
              <TableCell>Documento</TableCell>
              <TableCell>Cantidad de Actores</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Box py={4}>
                    <CircularProgress />
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredCountries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No se encontraron países
                </TableCell>
              </TableRow>
            ) : (
              filteredCountries.map((country) => (
                <TableRow hover key={country.code2}>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <img
                        src={`https://flagcdn.com/w40/${country.code2.toLowerCase()}.png`}
                        alt={country.name}
                        width={24}
                      />

                      <Typography fontWeight={600}>
                        {country.name}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {country.fileName ? (
                      <Chip
                        size="small"
                        label={country.fileName}
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        size="small"
                        label="Sin documento"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      color="info"
                      label={`${country.actorCount} actor${
                        country.actorCount !== 1 ? "es" : ""
                      }`}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                    >
                      <Tooltip title="Descargar documento">
                        <span>
                          <IconButton
                            color="primary"
                            disabled={!country.fileName}
                            onClick={() => handleDownload(country.code2)}
                          >
                            <Download />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {canWrite && (
                        <>
                          <Tooltip title="Subir/Reemplazar documento">
                            <IconButton
                              color="warning"
                              component="label"
                            >
                              <UploadFile />

                              <input
                                hidden
                                type="file"
                                accept=".doc,.docx"
                                onChange={(e) =>
                                  handleUpload(country.code2, e)
                                }
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Eliminar documento">
                            <span>
                              <IconButton
                                color="error"
                                disabled={!country.fileName}
                                onClick={() => handleDelete(country.code2)}
                              >
                                <Delete />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CountriesDashboard;
