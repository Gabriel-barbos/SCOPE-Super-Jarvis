import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001/api';

class EngineService {
  /**
   * Executa teste da engine
   * @param {File} file  Arquivo Excel
   * @returns {Promise} Resultado do teste
   */
  async testEngine(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${BACKEND_URL}/engine-test`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Executa engine em produção
   * @param {File} file Arquivo Excel
   * @returns {Promise} Resultado da execução
   */
  async executeEngine(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${BACKEND_URL}/engine`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

export default new EngineService();