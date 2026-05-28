package com.lovvi.dao;

import com.lovvi.infra.DatabaseConnection;
import com.lovvi.dto.CadastroUsuarioRequest;
import com.lovvi.dto.UsuarioCrudRequest;
import com.lovvi.dto.UsuarioCrudRow;
import com.lovvi.model.UsuarioPerfil;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class UsuarioDAO {

    private final DatabaseConnection db;

    public UsuarioDAO(DatabaseConnection db) {
        this.db = db;
    }

    public boolean existemInteresses(List<Integer> interestIds) throws SQLException {
        try (Connection conn = db.getConnection()) {
            return existemInteresses(conn, interestIds);
        }
    }

    private boolean existemInteresses(Connection conn, List<Integer> interestIds) throws SQLException {
        if (interestIds == null || interestIds.isEmpty()) {
            return true;
        }

        String placeholders = interestIds.stream().map(i -> "?").collect(Collectors.joining(","));
        String sql = "SELECT COUNT(1) AS total FROM interesse WHERE id_interesse IN (" + placeholders + ")";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < interestIds.size(); i++) {
                ps.setInt(i + 1, interestIds.get(i));
            }

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() && rs.getInt("total") == interestIds.size();
            }
        }
    }

    public int cadastrar(CadastroUsuarioRequest request, String genero, String generoInteresse, String tipoPerfil) throws SQLException {
        String insertUsuario = "INSERT INTO usuario (nome, sobrenome, email, senha, cidade, genero, genero_interesse, dt_nascimento) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        String insertPerfil = "INSERT INTO perfil (descricao, preferencias, objetivos, tipo_perfil, altura, id_usuario) VALUES (?, ?, ?, ?, ?, ?)";
        String insertTem = "INSERT INTO tem (id_usuario, id_interesse) VALUES (?, ?)";

        try (Connection conn = db.getConnection()) {
            conn.setAutoCommit(false);

            try {
                if (!existemInteresses(conn, request.interesses())) {
                    throw new SQLException("Interesse inexistente enviado no cadastro.");
                }

                int userId;
                try (PreparedStatement ps = conn.prepareStatement(insertUsuario, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, request.nome());
                    ps.setString(2, request.sobrenome());
                    ps.setString(3, request.email());
                    ps.setString(4, request.senha());
                    ps.setString(5, request.cidade());
                    ps.setString(6, genero);
                    ps.setString(7, generoInteresse);
                    ps.setDate(8, Date.valueOf(request.dtNascimento()));
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (!rs.next()) {
                            throw new SQLException("Nao foi possivel obter o ID do usuario cadastrado.");
                        }
                        userId = rs.getInt(1);
                    }
                }

                try (PreparedStatement ps = conn.prepareStatement(insertPerfil)) {
                    ps.setString(1, request.descricao());
                    ps.setString(2, request.preferencias());
                    ps.setString(3, request.objetivos());
                    ps.setString(4, tipoPerfil);
                    ps.setBigDecimal(5, request.altura());
                    ps.setInt(6, userId);
                    ps.executeUpdate();
                }

                if (request.interesses() != null) {
                    try (PreparedStatement ps = conn.prepareStatement(insertTem)) {
                        for (Integer idInteresse : request.interesses()) {
                            ps.setInt(1, userId);
                            ps.setInt(2, idInteresse);
                            ps.addBatch();
                        }
                        ps.executeBatch();
                    }
                }

                conn.commit();
                return userId;
            } catch (SQLException e) {
                conn.rollback();
                throw e;
            }
        }
    }

    public List<UsuarioCrudRow> listarCrud(int limit) throws SQLException {
        List<UsuarioCrudRow> usuarios = new ArrayList<>();
        String sql = "SELECT id_usuario, nome, sobrenome, email, cidade, genero, dt_nascimento " +
                "FROM usuario ORDER BY id_usuario DESC LIMIT ?";

        try (Connection conn = db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Date nascimento = rs.getDate("dt_nascimento");
                    usuarios.add(new UsuarioCrudRow(
                            rs.getInt("id_usuario"),
                            rs.getString("nome"),
                            rs.getString("sobrenome"),
                            rs.getString("email"),
                            rs.getString("cidade"),
                            rs.getString("genero"),
                            nascimento != null ? nascimento.toLocalDate() : null
                    ));
                }
            }
        }

        return usuarios;
    }

    public int inserirCrud(UsuarioCrudRequest request) throws SQLException {
        String sql = "INSERT INTO usuario (nome, sobrenome, email, senha, cidade, genero, dt_nascimento) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            preencherUsuarioCrud(ps, request);
            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    public boolean atualizarCrud(int idUsuario, UsuarioCrudRequest request) throws SQLException {
        String sql = "UPDATE usuario SET nome = ?, sobrenome = ?, email = ?, senha = ?, cidade = ?, genero = ?, " +
                "dt_nascimento = ? WHERE id_usuario = ?";

        try (Connection conn = db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            preencherUsuarioCrud(ps, request);
            ps.setInt(8, idUsuario);
            return ps.executeUpdate() > 0;
        }
    }

    private void preencherUsuarioCrud(PreparedStatement ps, UsuarioCrudRequest request) throws SQLException {
        ps.setString(1, request.nome().trim());
        ps.setString(2, request.sobrenome().trim());
        ps.setString(3, request.email().trim());
        ps.setString(4, request.senha());
        ps.setString(5, request.cidade().trim());
        ps.setString(6, request.genero().trim());
        ps.setDate(7, Date.valueOf(request.dtNascimento()));
    }

    public boolean excluirCrud(int idUsuario) throws SQLException {
        String sql = "DELETE FROM usuario WHERE id_usuario = ?";

        try (Connection conn = db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idUsuario);
            return ps.executeUpdate() > 0;
        }
    }

    public UsuarioPerfil buscarPerfil(int idUsuario) throws SQLException {
        String sql = "SELECT u.id_usuario, u.nome, u.sobrenome, u.email, u.cidade, u.genero, u.genero_interesse, u.dt_nascimento, " +
                "p.descricao, p.preferencias, p.objetivos, p.tipo_perfil, p.altura " +
                "FROM usuario u " +
                "LEFT JOIN perfil p ON u.id_usuario = p.id_usuario " +
                "WHERE u.id_usuario = ?";

        try (Connection conn = db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return montarPerfil(conn, rs);
                }
            }
        }

        return null;
    }

    public List<UsuarioPerfil> listarPerfis() throws SQLException {
        List<UsuarioPerfil> lista = new ArrayList<>();
        String sql = "SELECT u.id_usuario, u.nome, u.sobrenome, u.email, u.cidade, u.genero, u.genero_interesse, u.dt_nascimento, " +
                "p.descricao, p.preferencias, p.objetivos, p.tipo_perfil, p.altura " +
                "FROM usuario u " +
                "LEFT JOIN perfil p ON u.id_usuario = p.id_usuario";

        try (Connection conn = db.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                lista.add(montarPerfil(conn, rs));
            }
        }

        return lista;
    }

    private UsuarioPerfil montarPerfil(Connection conn, ResultSet rs) throws SQLException {
        Date nascimento = rs.getDate("dt_nascimento");
        int userId = rs.getInt("id_usuario");

        return new UsuarioPerfil(
                userId,
                rs.getString("nome"),
                rs.getString("sobrenome"),
                rs.getString("email"),
                rs.getString("cidade"),
                rs.getString("genero"),
                rs.getString("genero_interesse"),
                nascimento != null ? nascimento.toLocalDate() : null,
                rs.getString("descricao"),
                rs.getString("preferencias"),
                rs.getString("objetivos"),
                rs.getString("tipo_perfil"),
                rs.getBigDecimal("altura"),
                listarIdsInteresse(conn, userId)
        );
    }

    private List<Integer> listarIdsInteresse(Connection conn, int idUsuario) throws SQLException {
        List<Integer> ids = new ArrayList<>();
        String sql = "SELECT id_interesse FROM tem WHERE id_usuario = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, idUsuario);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("id_interesse"));
                }
            }
        }

        return ids;
    }

    public List<String> listarInteressesEmComum(int sourceId, int targetId) throws SQLException {
        List<String> names = new ArrayList<>();
        String sql = "SELECT i.nome_interesse FROM interesse i " +
                "JOIN tem t1 ON i.id_interesse = t1.id_interesse " +
                "JOIN tem t2 ON i.id_interesse = t2.id_interesse " +
                "WHERE t1.id_usuario = ? AND t2.id_usuario = ?";

        try (Connection conn = db.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, sourceId);
            ps.setInt(2, targetId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    names.add(rs.getString("nome_interesse"));
                }
            }
        }

        return names;
    }
}
