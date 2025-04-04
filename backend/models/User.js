const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

const User = db.define(
  "User",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "user_id",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    historical_landmark_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    historical_place_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    history_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tourist_attraction_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wildlife_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    art_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    aquarium_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    monument_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    hiking_area_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    zoo_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    catholic_cathedral_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    nature_preserve_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    amusement_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    garden_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    theme_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    water_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    scenic_spot_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    observatory_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    castle_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    archaeological_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    public_beach_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    national_forest_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    catholic_church_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    heritage_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    beach_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    synagogue_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ecological_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wax_museum_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    hindu_temple_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wildlife_safari_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    buddhist_temple_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    animal_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wildlife_refuge_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    heritage_building_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    vista_point_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    national_park_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    monastery_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    fortress_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    beach_pavilion_pref: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "User",
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to check password
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
