CREATE TABLE usuario (
    id_usuario    INT          NOT NULL AUTO_INCREMENT,
    nome          VARCHAR(100) NOT NULL,
    sobrenome     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    senha         VARCHAR(255) NOT NULL,
    cidade        VARCHAR(100),
    genero        VARCHAR(30)  NOT NULL
                  CHECK (genero IN ('Masculino', 'Feminino', 'Nao-binario', 'Outro')),
    genero_interesse VARCHAR(30) NOT NULL DEFAULT 'Todos'
                  CHECK (genero_interesse IN ('Masculino', 'Feminino', 'Nao-binario', 'Outro', 'Todos')),
    dt_nascimento DATE         NOT NULL,
    CONSTRAINT pk_usuario    PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

CREATE TABLE perfil (
    id_perfil    INT          NOT NULL AUTO_INCREMENT,
    descricao    TEXT,
    preferencias VARCHAR(255),
    objetivos    VARCHAR(255),
    tipo_perfil  VARCHAR(50)  CHECK (tipo_perfil IN ('casual', 'amizade', 'relacionamento')),
    altura       DECIMAL(4,2) CHECK (altura BETWEEN 1.00 AND 2.50),
    id_usuario   INT          NOT NULL,
    CONSTRAINT pk_perfil           PRIMARY KEY (id_perfil),
    CONSTRAINT uq_perfil_usuario   UNIQUE (id_usuario),
    CONSTRAINT fk_perfil_usuario   FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE foto (
    num_foto    INT          NOT NULL AUTO_INCREMENT,
    url_foto    VARCHAR(500) NOT NULL,
    data_upload DATE         NOT NULL DEFAULT (CURRENT_DATE),
    id_usuario  INT          NOT NULL,
    CONSTRAINT pk_foto         PRIMARY KEY (num_foto),
    CONSTRAINT fk_foto_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE interesse (
    id_interesse   INT          NOT NULL AUTO_INCREMENT,
    nome_interesse VARCHAR(100) NOT NULL,
    categoria      VARCHAR(50)  NOT NULL,
    CONSTRAINT pk_interesse      PRIMARY KEY (id_interesse),
    CONSTRAINT uq_interesse_nome UNIQUE (nome_interesse)
);

CREATE TABLE tem (
    id_usuario   INT NOT NULL,
    id_interesse INT NOT NULL,
    CONSTRAINT pk_tem          PRIMARY KEY (id_usuario, id_interesse),
    CONSTRAINT fk_tem_usuario  FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_tem_interesse FOREIGN KEY (id_interesse)
        REFERENCES interesse(id_interesse)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE lovvi_match (
    id_match        INT           NOT NULL AUTO_INCREMENT,
    id_usuario_1    INT           NOT NULL,
    id_usuario_2    INT           NOT NULL,
    data_match      DATE          NOT NULL DEFAULT (CURRENT_DATE),
    compatibilidade DECIMAL(5,2)  CHECK (compatibilidade BETWEEN 0.00 AND 100.00),
    status_match    VARCHAR(20)   NOT NULL DEFAULT 'pendente'
                    CHECK (status_match IN ('pendente', 'aceito', 'recusado')),
    CONSTRAINT pk_match         PRIMARY KEY (id_match),
    CONSTRAINT fk_match_usuario1 FOREIGN KEY (id_usuario_1)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_match_usuario2 FOREIGN KEY (id_usuario_2)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE usuario_amizade (
    id_usuario          INT         NOT NULL,
    tipo_role_preferido VARCHAR(50) DEFAULT 'sem preferencia',
    CONSTRAINT pk_usuario_amizade    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_amizade_usuario    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE usuario_relacionamento_serio (
    id_usuario          INT        NOT NULL,
    distancia_maxima    INT        CHECK (distancia_maxima > 0),
    tipo_relacionamento VARCHAR(50),
    pretende_ter_filhos TINYINT(1) NOT NULL DEFAULT 0,
    CONSTRAINT pk_usuario_rel_serio  PRIMARY KEY (id_usuario),
    CONSTRAINT fk_rel_serio_usuario  FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE teste (
    id_teste   INT          NOT NULL AUTO_INCREMENT,
    nome_teste VARCHAR(150) NOT NULL,
    descricao  TEXT,
    CONSTRAINT pk_teste PRIMARY KEY (id_teste)
);

CREATE TABLE pergunta (
    id_pergunta    INT  NOT NULL AUTO_INCREMENT,
    texto_pergunta TEXT NOT NULL,
    categoria      VARCHAR(50),
    id_teste       INT  NULL,
    CONSTRAINT pk_pergunta      PRIMARY KEY (id_pergunta),
    CONSTRAINT fk_pergunta_teste FOREIGN KEY (id_teste)
        REFERENCES teste(id_teste)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE opcao_resposta (
    id_opcao    INT          NOT NULL AUTO_INCREMENT,
    texto_opcao VARCHAR(255) NOT NULL,
    id_pergunta INT          NOT NULL,
    CONSTRAINT pk_opcao_resposta  PRIMARY KEY (id_opcao),
    CONSTRAINT fk_opcao_pergunta  FOREIGN KEY (id_pergunta)
        REFERENCES pergunta(id_pergunta)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE resposta (
    id_usuario  INT NOT NULL,
    id_pergunta INT NOT NULL,
    id_opcao    INT NOT NULL,
    CONSTRAINT pk_resposta          PRIMARY KEY (id_usuario, id_pergunta),
    CONSTRAINT fk_resposta_usuario  FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_resposta_pergunta FOREIGN KEY (id_pergunta)
        REFERENCES pergunta(id_pergunta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_resposta_opcao    FOREIGN KEY (id_opcao)
        REFERENCES opcao_resposta(id_opcao)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
